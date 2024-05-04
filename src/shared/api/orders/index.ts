import type { SearchParameters } from "~/shared/api/internal/instance";

export const getOrders = (query: SearchParameters) => {
    return $fetch("method/orders.getTest", {
        query
    });
};