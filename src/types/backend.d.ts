export { };
declare global{
    interface IRequest{
        url: string;
        method: string,
        body?: { [key: string]: never };
        queryParams?: never;
        useCredentials?: boolean;
        headers?: never;
        nextOption?: never;
    }
    interface IBackendRes<T>{
        error?: string | string[];
        message: string;
        statusCode: number | string;
        data: T;
    }
    interface IModelPaginate<T>{
        meta: {
            page: number;
            pageSize: number;
            pages: number;
            total: number;
        },
        result: T[]
    }

    interface ILoginRes {
        accessToken: string;
        expires_in: number;
        user: IUser
    }
    interface IAccount{
        id:number;
        lastModifiedDate:string;
        login: string;
        email: string;
        gender: string;
        phone:string;
        createdDate:string
        createdBy: string;
        lastModifiedBy: string;
    }
   

    interface IRole {
        id: number;
        name: string;
        description: string;
        permissions: IPermission[];
    }
    interface IPermission {
        id: number;
        name: string;
        apiPath: string;
        method: string;
        module: string;
    }


    interface User {
        id: number;
        login: string;
        name?: string;
        email: string;
        phone?: string;
        gender?: string;
        langKey?: string;
        authorities?: string[];
        activated:boolean;
    }

    // interface ResLoginDTO {
    //     accessToken: string;
    //     user: User;
    // }
    interface IUser extends User{
        role:string;
    }

    interface ResultPaginationDTO {
        meta: {
            page: number;
            pageSize: number;
            pages: number;
            total: number;
        };
        result: User[];
    }

    interface IPromotion {
        id?: number;
        title: string;
        detail?: string;
        discountPercentage: number;
        startTime: string;   // ISO LocalDateTime string e.g. "2025-12-01T00:00:00"
        endTime: string;
        thumbnailUrl?: string;
        status?: 'Active' | 'Upcoming' | 'Expired';
    }



}