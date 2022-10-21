/*
 * Copyright (c) 2021-2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { merge } from 'smob';
import { ObjectLiteral } from '../../type';
import { FiltersBuildInput } from './type';
import { FilterInputOperatorValue } from './constants';
import { isFilterValueConfig } from './utils';
import { flattenNestedObject } from '../../utils';

const OperatorWeight = {
    [FilterInputOperatorValue.NEGATION]: 0,
    [FilterInputOperatorValue.LIKE]: 50,
    [FilterInputOperatorValue.LESS_THAN_EQUAL]: 150,
    [FilterInputOperatorValue.LESS_THAN]: 450,
    [FilterInputOperatorValue.MORE_THAN_EQUAL]: 1350,
    [FilterInputOperatorValue.MORE_THAN]: 4050,
    [FilterInputOperatorValue.IN]: 13105,
};

export function buildQueryFilters<T extends ObjectLiteral = ObjectLiteral>(
    data?: FiltersBuildInput<T>,
) : Record<string, any> {
    if (typeof data === 'undefined') {
        return {};
    }

    return flattenNestedObject(data, {
        transformer: (input, output, key) => {
            if (typeof input === 'undefined') {
                output[key] = null;

                return true;
            }

            if (Array.isArray(input)) {
                // todo: check array elements are string
                output[key] = input.join(',');

                return true;
            }

            if (isFilterValueConfig(input)) {
                if (typeof input.value === 'undefined') {
                    input.value = null;
                }

                if (Array.isArray(input.value)) {
                    // todo: check array elements are string
                    input.value = input.value.join(',');
                }

                if (Array.isArray(input.operator)) {
                    // merge operators
                    input.operator = input.operator
                        .sort((a, b) => OperatorWeight[a] - OperatorWeight[b])
                        .join('') as FilterInputOperatorValue;
                }

                output[key] = `${input.operator}${input.value}`;

                return true;
            }

            return undefined;
        },
    });
}

export function mergeQueryFilters<T>(
    target?: Record<string, any>,
    source?: Record<string, any>,
) : Record<string, any> {
    return merge({}, target || {}, source || {});
}
