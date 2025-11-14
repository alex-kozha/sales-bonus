/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  let { discount, sale_price, quantity } = purchase;
  discount = discount / 100; //переводим скидку
  const fulsum = sale_price * quantity; //общая цена всех товаров без скидки
  const final_sale = fulsum * (1 - discount); //цена продажа со скидкой
  return final_sale - _product.purchase_price * quantity; //прибыль
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;
  if (index === 0) {
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    // Для всех остальных
    return profit * 0.05;
  }
  // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  const { calculateRevenue, calculateBonus } = options;
  if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
    throw new Error("Некорректные входные данные");
  }
  if (
    !typeof calculateRevenue === "function" ||
    !typeof calculateBonus === "function"
  ) {
    throw new Error("Чего-то не хватает");
  }

  // @TODO: Проверка наличия опций

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));
  const someIndex = Object.fromEntries(
    sellerStats.map((item) => [item.id, item])
  );
  const productIndex = Object.fromEntries(
    data.products.map((item) => [item.sku, item])
  ); // Ключом будет sku, значением — запись из data.products
  //console.log(productIndex)
  // @TODO: Индексация продавцов и товаров для быстрого доступа
  data.purchase_records.forEach((record) => {
    // Чек
    const seller = someIndex[record.seller_id]; // Продавец
    ++seller.sales_count;
    seller.revenue += record.total_amount;
    record.items.forEach((solit) => {
      const pr = data.products.find((p) => p.sku == solit.sku);
      const money = calculateSimpleRevenue(solit, pr);
      seller.profit += money;
      if (!seller.products_sold[solit.sku]) {
        seller.products_sold[solit.sku] = 0;
      }
      seller.products_sold[solit.sku] += solit.quantity;
    });

    sellerStats.sort((a, b) => b.profit - a.profit);
    seller.bonus = calculateBonusByProfit(
      sellerStats.indexOf(seller),
      sellerStats.length,
      seller
    );
    seller.top_products = Object.entries(seller.products_sold);

    seller.top_products = seller.top_products.map((el) => {
      return { sku: el[0], quantity: el[1] };
    });
    seller.top_products.sort((a, b) => b.quantity - a.quantity);
    seller.top_products = seller.top_products.slice(0, 10);
  });

  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: Math.round(seller.revenue * 100) / 100,
    profit: Math.round(seller.profit * 100) / 100,
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: seller.bonus,
  }));
}
