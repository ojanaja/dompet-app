/**
 * Generic Base Repository
 * Mengabstraksi fungsi CRUD standar pada model Prisma untuk menghindari repetisi (DRY).
 * Pattern ini memungkinkan kita memanggil `.findMany`, `.create`, dsb tanpa menulis kode berulang.
 */
export class BaseRepository<
    ModelDelegate extends {
        findMany: (args?: any) => Promise<any>;
        findUnique: (args: any) => Promise<any>;
        create: (args: { data: any }) => Promise<any>;
        update: (args: { where: any; data: any }) => Promise<any>;
        delete: (args: { where: any }) => Promise<any>;
    }
> {
    protected readonly model: ModelDelegate;

    constructor(model: ModelDelegate) {
        this.model = model;
    }

    async findAll(args?: Parameters<ModelDelegate['findMany']>[0]): Promise<Awaited<ReturnType<ModelDelegate['findMany']>>> {
        return this.model.findMany(args || {});
    }

    async findById(id: string, include?: any): Promise<Awaited<ReturnType<ModelDelegate['findUnique']>> | null> {
        return this.model.findUnique({
            where: { id },
            include,
        });
    }

    async create(data: Parameters<ModelDelegate['create']>[0]['data']): Promise<Awaited<ReturnType<ModelDelegate['create']>>> {
        return this.model.create({ data });
    }

    async update(
        id: string,
        data: Parameters<ModelDelegate['update']>[0]['data']
    ): Promise<Awaited<ReturnType<ModelDelegate['update']>>> {
        return this.model.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<Awaited<ReturnType<ModelDelegate['delete']>>> {
        return this.model.delete({
            where: { id },
        });
    }
}
