/*
 * Copyright (c) 2021.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import {
    buildFieldDomainRecords,
    DEFAULT_ALIAS_ID,
    FieldOperator,
    FieldsParseOptions,
    FieldsParseOutput,
    parseQueryFields,
    parseQueryRelations,
} from '../../src';
import {buildObjectFromStringArray} from '../../src/utils';

describe('src/fields/index.ts', () => {
    it('should transform allowed domain fields', () => {
        const fields : string[] = ['id', 'name'];

        let transformedFields = buildFieldDomainRecords(fields);
        expect(transformedFields).toEqual({ [DEFAULT_ALIAS_ID]: fields });

        transformedFields = buildFieldDomainRecords({ domain: fields });
        expect(transformedFields).toEqual({ domain: fields });

        transformedFields = buildFieldDomainRecords({});
        expect(transformedFields).toEqual({});
    });

    it('should transform fields with defaultAlias', () => {
        let options : FieldsParseOptions = {
            allowed: ['id', 'name', 'email'],
            defaultAlias: 'user'
        };

        let data = parseQueryFields('+email', options);

        expect(data).toEqual([
            {
                key: 'email',
                value: FieldOperator.INCLUDE,
                alias: 'user'
            }
        ] as FieldsParseOutput);

        options = {
            allowed: {
                user: ['id', 'name', 'email'],
                domain: ['extra']
            },
            defaultAlias: 'user'
        }

        data = parseQueryFields('+email', options);
        expect(data).toEqual([
            {
                key: 'email',
                value: FieldOperator.INCLUDE,
                alias: 'user'
            }
        ] as FieldsParseOutput);

        data = parseQueryFields('+extra', options);
        expect(data).toEqual([]);

        data = parseQueryFields({
            domain: '+extra'
        }, options);
        expect(data).toEqual([
            {
                key: 'extra',
                value: FieldOperator.INCLUDE,
                alias: 'domain'
            }
        ] as FieldsParseOutput);
    })

    it('should transform fields', () => {
        const options : FieldsParseOptions = {
            allowed: ['id', 'name'],
        };

        // fields undefined
        let data = parseQueryFields(undefined, options);
        expect(data).toEqual([]);

        // fields as array
        data = parseQueryFields(['id'], options);
        expect(data).toEqual([{ key: 'id' }] as FieldsParseOutput);

        // fields as string
        data = parseQueryFields('id', options);
        expect(data).toEqual([{ key: 'id' }] as FieldsParseOutput);

        // multiple fields but only one valid field
        data = parseQueryFields(['id', 'avatar'], options);
        expect(data).toEqual([{ key: 'id' }] as FieldsParseOutput);

        // field as string and append fields
        data = parseQueryFields('+id', options);
        expect(data).toEqual([{ key: 'id', value: FieldOperator.INCLUDE }] as FieldsParseOutput);

        data = parseQueryFields('-id', options);
        expect(data).toEqual([{ key: 'id', value: FieldOperator.EXCLUDE }] as FieldsParseOutput);

        // fields as string and append fields
        data = parseQueryFields('id,+name', options);
        expect(data).toEqual([{ key: 'id' }, { key: 'name' }] as FieldsParseOutput);

        // empty allowed -> allows nothing
        data = parseQueryFields('id', { ...options, allowed: [] });
        expect(data).toEqual([] as FieldsParseOutput);

        // undefined allowed -> allows nothing
        data = parseQueryFields('id', { ...options, allowed: undefined });
        expect(data).toEqual([] as FieldsParseOutput);

        // field not allowed
        data = parseQueryFields('avatar', options);
        expect(data).toEqual([] as FieldsParseOutput);

        // field with invalid value
        data = parseQueryFields({ id: null }, options);
        expect(data).toEqual([] as FieldsParseOutput);

        // if only one domain is given, try to parse request field to single domain.
        data = parseQueryFields(['id'], { allowed: { domain: ['id'] } });
        expect(data).toEqual([{ alias: 'domain', key: 'id' }] as FieldsParseOutput);

        // if multiple possibilities are available for request field, than parse to none
        data = parseQueryFields(['id'], { allowed: { domain: ['id'], domain2: ['id'] } });
        expect(data).toEqual([] as FieldsParseOutput);
    });

    it('should transform fields with defaults', () => {
        let data = parseQueryFields([], { default: { domain: ['id', 'name'] } });
        expect(data).toEqual([{ alias: 'domain', key: 'id' }, { alias: 'domain', key: 'name'}] as FieldsParseOutput);

        data = parseQueryFields(['id'], { default: { domain: ['id', 'name'] } });
        expect(data).toEqual([{ alias: 'domain', key: 'id' }] as FieldsParseOutput);

        data = parseQueryFields(['fake'], { default: { domain: ['id', 'name'] } });
        expect(data).toEqual([{ alias: 'domain', key: 'id' }, { alias: 'domain', key: 'name'}] as FieldsParseOutput);

        data = parseQueryFields(['id'], { default: { domain: ['name'] }, allowed: { domain: ['id' ] }});
        expect(data).toEqual([{ alias: 'domain', key: 'id' }] as FieldsParseOutput);

        data = parseQueryFields([], { default: { domain: ['name'] }, allowed: { domain: ['id' ] }});
        expect(data).toEqual([{ alias: 'domain', key: 'name' }] as FieldsParseOutput);
    })

    it('should transform fields with includes', () => {
        const includes = parseQueryRelations(['profile', 'roles'], { allowed: ['user', 'profile'] });

        // simple domain match
        let data = parseQueryFields({ profile: ['id'] }, { allowed: { profile: ['id'] }, relations: includes });
        expect(data).toEqual([{ alias: 'profile', key: 'id' }] as FieldsParseOutput);

        // only single domain match
        data = parseQueryFields({ profile: ['id'], permissions: ['id'] }, { allowed: { profile: ['id'], permissions: ['id'] }, relations: includes });
        expect(data).toEqual([{ alias: 'profile', key: 'id' }] as FieldsParseOutput);
    });

    it('should transform allowed fields', () => {
        const fields : string[] = ['id'];

        let transformedFields = buildObjectFromStringArray(fields);
        expect(transformedFields).toEqual({ [fields[0]]: fields[0] });

        transformedFields = buildObjectFromStringArray({ idAlias: 'id' });
        expect(transformedFields).toEqual({ idAlias: 'id' });
    });
});
