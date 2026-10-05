// Only schema-less dynamic queries use this marker. Model queries keep Prisma's
// normal Date/Decimal decoding. Encoding affected PG values as JSON retains their
// public API representation while still using the same Prisma transaction.
export const DYNAMIC_QUERY_MARKER = '/* owl:dynamic-result */';

export function preserveDynamicResults(pool: any) {
    const { types } = require('pg');
    const stringArray = types.getTypeParser(1009, 'text');
    const dateOnly = (value: string) => value === 'infinity' ? Infinity : value === '-infinity' ? -Infinity : value;
    const dateArray = (values: any[]): any[] => values.map(value => Array.isArray(value) ? dateArray(value) : value === null ? null : dateOnly(value));
    const parsers = new Map<number, (value: string) => any>([
        [1082, dateOnly],
        [1114, types.getTypeParser(1114, 'text')],
        [1184, types.getTypeParser(1184, 'text')],
        [1700, (value: string) => value],
        [1182, (value: string) => dateArray(stringArray(value))],
        [1115, types.getTypeParser(1115, 'text')],
        [1185, types.getTypeParser(1185, 'text')],
        [1231, stringArray],
    ]);
    pool.on('connect', (client: any) => {
        const query = client.query.bind(client);
        client.query = (config: any, ...args: any[]) => {
            if (typeof config?.text !== 'string' || !config.text.startsWith(DYNAMIC_QUERY_MARKER)) return query(config, ...args);
            const getTypeParser = config.types.getTypeParser;
            const options = { ...config, types: { getTypeParser: (oid: number, format: string) => {
                const parse = format === 'text' ? parsers.get(oid) : undefined;
                return parse ? (value: string) => JSON.stringify(parse(value)) : getTypeParser(oid, format);
            } } };
            const convert = (result: any) => ({ ...result,
                fields: result.fields.map((field: any) => parsers.has(field.dataTypeID) ? { ...field, dataTypeID: 114 } : field),
            });
            const callback = args[args.length - 1];
            if (typeof callback === 'function') return query(options, ...args.slice(0, -1), (error: any, result: any) => callback(error, error ? result : convert(result)));
            return query(options, ...args).then(convert);
        };
    });
}
