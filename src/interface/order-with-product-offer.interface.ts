import { Offer, Order, Product } from "../models"

export interface OrderWithProductOffer {
    order: Order,
    product: Product,
    offers: Offer[]
}