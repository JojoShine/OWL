import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { shared } from '../compatibility/shared';
import { live } from '../identity/identity.helpers';

@Injectable()
export class MaskingService {
  private readonly factory: any;
  readonly middleware: any;
  constructor(db: PrismaService) {
    this.factory = shared('http/dataMasking').createDataMasking({
      loadFields: () => db.owl_sensitive_fields.findMany({
        where: { ...live, is_active: true },
        select: { field_name: true, mask_type: true, mask_rule: true },
      }),
    });
    this.middleware = this.factory();
  }
  invalidate() { this.factory.invalidateSensitiveFields(); }
}
