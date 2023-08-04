import { ObjectId } from "mongodb"
import { Order, Product, User } from "../models"

export interface OfferWithData {
    _id: ObjectId,
    createdAt: Date,
    updatedAt: Date,
    idOffer: string,
    createBy: string,
    status: number,
    price: number,
    despacho: string,
    company: string,
    origen: string,
    estado: string,
    cantidad: number,
    idOrder: ObjectId,
    idProduct: ObjectId,
    confirmedAtAdmin: Date | null,
    confirmedAtClaimant: Date | null,
    product: Product,
    order: Order,
    commerce: User,
    workshop: User
}