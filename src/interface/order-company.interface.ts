import { Company } from "./company.interface";

export interface OrderCompany {
    id: string, 
    idOrder: string, 
    createBy: string, 
    company: Company,
    status: number,
    closingDate: Date | undefined
}