<template>
    <FixedLeftColumn>
        <template
            v-slot:fixed
        >
            <div
                class="d_f f-d_c base-gap"
            >
                <div
                    class="block base-gap inner-gap d_f f-d_c"
                >
                    <InputDate
                        v-model="filter.date"
                        :required="false"
                        label="Период"
                        range
                    />
                    <Search
                        v-model:search-query="filter.searchQuery"
                        v-model:search-type="filter.searchType"
                        select-display-value="icon"
                        :search-types="searchTypes"
                    />
                    
                    <div
                        class="d_f gap-5"
                    >
                        <Toggle
                            :pressed="toggleState === 'Все'"
                            color="gray"
                            @click="toggleState = 'Все'"
                        >
                            Все
                        </Toggle>
                        
                        <Toggle
                            v-for="(option, index) in sortOptions"
                            :key="index"
                            :pressed="toggleState === option"
                            color="gray"
                            @click="toggleState = option"
                        >
                            <i
                                class="icon"
                                :class="[`icon-${option}`, `icon-${option}__regular`]"
                            />
                        </Toggle>
                    </div>
                </div>
                
                <div
                    class="block base-gap inner-gap d_f f-d_c"
                >
                    <Select
                        v-model="filter.year"
                        :items="yearsTypes"
                        :with-checkmark="false"
                        :width-by-content="true"
                        label="Год"
                        theme="solid"
                    />
                    
                    <div
                        class="d_f gap-5"
                    >
                        <Button
                            width="full"
                            @click="fetchOrders"
                        >
                            Показать
                        </Button>
                        
                        <Button
                            width="full"
                            color="gray"
                            @click="resetChanges"
                        >
                            Сбросить
                        </Button>
                    </div>
                    
                    <span
                        class="text-center text-10"
                    >
                        Обычный вывод показыват 250 заказов, чтобы снять ограничение
                        и показать до 5000 заказов нужно выбрать год
                    </span>
                </div>
            </div>
        </template>
        
        <SpinnerLoader
            v-if="isLoading"
        />
        
        <Empty
            v-else-if="!isLoading && !ordersLoaded"
            without-image
        >
            Заказов еще нет
        </Empty>
        
        <template
            v-else
        >
            <StatusCard
                v-for="(order, index) in ordersList"
                :key="index"
                status="success"
                class="block block-margin block-padding"
            >
                №: {{ order.id }}
            </StatusCard>
        </template>
    </FixedLeftColumn>
</template>

<script
    setup
    lang="ts"
>
import { FixedLeftColumn } from "~/shared/ui/templates";
import { InputDate } from "~/shared/ui/inputs/input-date";
import { Search } from "~/shared/ui/search";
import { Toggle } from "~/shared/ui/toggle";
import { Select } from "~/shared/ui/select";
import { Button } from "~/shared/ui/button";
import { StatusCard } from "~/shared/ui/status-card";
import { Empty } from "~/shared/ui/empty";
import { SpinnerLoader } from "~/shared/ui/spinner-loader";

import type { Order } from "~/shared/api/orders/types";
import { getOrders } from "~/shared/api/orders";
import type { Response } from "~/shared/api/internal/types";

const router = useRouter();
const route = useRoute();

const isLoading = ref(true);
const ordersLoaded = ref(true);

const toggleState = ref("");
const filter = ref({
    date: ["", ""],
    searchQuery: "",
    year: "",
    searchType: "order_number"
});

const clearFilter = computed(() => {
    const preparedQuery = {
        date_start: filter.value.date[0] ? useDateFormat(filter.value.date[0], "YYYYMMDD").value : undefined,
        date_finish: filter.value.date[1] ? useDateFormat(filter.value.date[1], "YYYYMMDD").value : undefined,
        search_type: filter.value.searchType,
        search_value: filter.value.searchQuery,
        year: filter.value.year
    };
    
    const clearQuery = Object.fromEntries(
        Object.entries(preparedQuery).filter(([_, value]) => value !== undefined && value !== "")
    );
    
    return clearQuery;
});

const orderId = computed(() => {
    return "id" in route.params ? route.params.id : undefined;
});

const sortOptions = ["crown"];

const searchTypes = {
    order_number: {
        title: "Номер заказа",
        placeholder: "Введите номер заказа"
    },
    psid: {
        title: "Номер фотосессии",
        placeholder: "Введите номер фотосессии"
    },
    client_id: {
        title: "Клиент ID",
        placeholder: "Введите клиент ID"
    },
    phone: {
        title: "Телефон",
        placeholder: "Введите телефон"
    },
    email: {
        title: "Email",
        placeholder: "Введите email"
    },
    payer: {
        title: "Плательщик, ребенок",
        placeholder: "Введите имя плательщика"
    }
};

const yearsTypes = [
    {
        value: "2023",
        title: "2023"
    },
    {
        value: "2022",
        title: "2022"
    },
    {
        value: "2021",
        title: "2021"
    }
];

const resetChanges = () => {
    filter.value = {
        date: [],
        searchQuery: "",
        year: "",
        searchType: "order_number"
    };
};

const ordersList = ref<Order[]>([]);

const fetchOrders = async () => {
    isLoading.value = true;
    try {
        const { response } = (await getOrders({ ...clearFilter.value })) as Response;
        
        ordersList.value = response.data.orders;
        ordersLoaded.value = !!ordersList.value;
    }
    catch (error) {
        ordersLoaded.value = false;
    }
    finally {
        isLoading.value = false;
    }
};

const debouncedFetchOrders = useDebounceFn(fetchOrders, 500);

const restoreFiltersFromQuery = () => {
    const pattern = /(\d{4})(\d{2})(\d{2})/;
    const dateStart = route.query.date_start ? String(route.query.date_start).replace(pattern, "$1-$2-$3") : "";
    const dateFinish = route.query.date_finish ? String(route.query.date_finish).replace(pattern, "$1-$2-$3") : "";
    
    filter.value = {
        searchQuery: "search_value" in route.query ? String(route.query.search_value) : "",
        year: "year" in route.query ? String(route.query.year) : "",
        searchType: "search_type" in route.query ? String(route.query.search_type) : "order_number",
        date: [dateStart, dateFinish]
    };
};

watch(filter, () => {
        if (orderId.value) {
            return;
        }
        
        router.replace({
            ...route,
            query: clearFilter.value
        });

        debouncedFetchOrders();
    },
    { deep: true }
);

onBeforeMount(() => {
    if (!orderId.value) {
        restoreFiltersFromQuery();
    }
    else {
        ordersList.value.push({ id: orderId.value } as Order);
        isLoading.value = false;
    }
});

</script>