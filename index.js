async function fetchData() {
    try {
        // Fetch data from the Hosted server
        const response = await fetch('https://insurecomp.com/sales-data.txt');
        const csvText = await response.text();

        const rows = csvText.trim().split('\n').map(row => row.split(','));
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            // Convert row into an object with keys from headers
            return row.reduce((acc, value, index) => {
                acc[headers[index]] = value;
                return acc;
            }, {});
        }).filter(row =>
            // Filter out empty rows
            Object.values(row).some(value => value)
        );

        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

async function analyzeAndDisplaySalesData() {
    try {
        // Fetch the data and set up necessary variables
        const inputData = await fetchData();
        // Helper function for 'YYYY-MM' format
        const getMonth = date => date.slice(0, 7);

        let totalSales = 0;
        let monthWiseSales = {};
        let monthWisePopularItems = {};
        let monthWiseTopRevenueItems = {};
        let popularItemData = {};

        inputData.forEach(item => {
            const month = getMonth(item.Date);
            const sku = item.SKU;
            const quantity = parseInt(item.Quantity);
            const revenue = parseFloat(item['Total Price']);

            // 1.Calculate total sales of the store
            totalSales += revenue;

            // 2.Calculate month-wise sales totals
            monthWiseSales[month] = (monthWiseSales[month] || 0) + revenue;

            // Track most popular item by quantity each month
            if (!monthWisePopularItems[month]) {
                monthWisePopularItems[month] = {};
            }
            monthWisePopularItems[month][sku] = (monthWisePopularItems[month][sku] || 0) + quantity;

            // Track items generating most revenue each month
            if (!monthWiseTopRevenueItems[month]) {
                monthWiseTopRevenueItems[month] = {};
            }
            monthWiseTopRevenueItems[month][sku] = (monthWiseTopRevenueItems[month][sku] || 0) + revenue;

            // Track overall quantities for each SKU
            popularItemData[sku] = (popularItemData[sku] || 0) + quantity;
        });

        // 3. Get the most popular item in each month (most quantity sold)
        const mostPopularItemsByMonth = {};
        for (let month in monthWisePopularItems) {
            const items = monthWisePopularItems[month];
            const topItem = Object.keys(items).reduce((a, b) => (items[a] > items[b] ? a : b));
            mostPopularItemsByMonth[month] = { SKU: topItem, Quantity: items[topItem] };
        }

        // 4. Get items generating the most revenue in each month
        const topRevenueItemsByMonth = {};
        for (let month in monthWiseTopRevenueItems) {
            const items = monthWiseTopRevenueItems[month];
            const topItem = Object.keys(items).reduce((a, b) => (items[a] > items[b] ? a : b));
            topRevenueItemsByMonth[month] = { SKU: topItem, Revenue: items[topItem] };
        }


        // 5.Calculate min, max, and average orders per month for the most popular item
        const overallPopularItem = Object.keys(popularItemData).reduce((a, b) => (popularItemData[a] > popularItemData[b] ? a : b));
        const monthlyOrders = [];
        for (let month in monthWisePopularItems) {
            if (monthWisePopularItems[month][overallPopularItem]) {
                monthlyOrders.push(monthWisePopularItems[month][overallPopularItem]);
            }
        }

        const minOrders = Math.min(...monthlyOrders);
        const maxOrders = Math.max(...monthlyOrders);
        const avgOrders = monthlyOrders.reduce((sum, qty) => sum + qty, 0) / monthlyOrders.length;

        // Display results
        console.log("Total Sales of the Store:", totalSales);
        console.log("Month-wise Sales Totals:", monthWiseSales);
        console.log("Most Popular Item (Quantity) in Each Month:", mostPopularItemsByMonth);
        console.log("Items Generating Most Revenue in Each Month:", topRevenueItemsByMonth);
        console.log(`For the Most Popular Item (${overallPopularItem}), Min Orders: ${minOrders}, Max Orders: ${maxOrders}, Avg Orders: ${avgOrders.toFixed(2)}`);
    } catch (error) {
        console.error('Error in analyzing and displaying sales data:', error);
    }
}

analyzeAndDisplaySalesData();
