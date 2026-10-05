import { Injectable } from '@nestjs/common';
import { SqlService } from '../dynamic/sql.service';
@Injectable()
export class DictionaryService {
    constructor(private readonly sql: SqlService) { }
    getDictionaryByType(type: string) { return this.sql.rows('SELECT dict_code, dict_name, dict_value, sort_order FROM owl_dictionary WHERE dict_type=:type AND is_active=true AND deleted_at IS NULL ORDER BY sort_order ASC', { type }); }
    async getDictionaryByTypes(types: string[]) { const rows = await this.sql.rows('SELECT dict_type, dict_code, dict_name, dict_value, sort_order FROM owl_dictionary WHERE dict_type IN (:types) AND is_active=true AND deleted_at IS NULL ORDER BY dict_type ASC, sort_order ASC', { types }); const grouped: Record<string, any[]> = {}; for (const row of rows)
        (grouped[row.dict_type] ||= []).push({ code: row.dict_code, name: row.dict_name, value: row.dict_value, sort: row.sort_order }); return grouped; }
}
