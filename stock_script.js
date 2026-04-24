document.addEventListener('DOMContentLoaded', () => {
    // 테마 토글
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        updateChartTheme();
    });

    // 데이터 초기화
    const marketData = {
        domestic: [
            { name: '삼성전자', symbol: '005930', yahoo: '005930.KS' },
            { name: 'SK하이닉스', symbol: '000660', yahoo: '000660.KS' },
            { name: 'LG에너지솔루션', symbol: '373220', yahoo: '373220.KS' },
            { name: '삼성바이오로직스', symbol: '207940', yahoo: '207940.KS' },
            { name: '현대차', symbol: '005380', yahoo: '005380.KS' }
        ],
        overseas: [
            { name: 'Apple Inc.', symbol: 'AAPL', yahoo: 'AAPL' },
            { name: 'Microsoft', symbol: 'MSFT', yahoo: 'MSFT' },
            { name: 'NVIDIA', symbol: 'NVDA', yahoo: 'NVDA' },
            { name: 'Alphabet A', symbol: 'GOOGL', yahoo: 'GOOGL' },
            { name: 'Tesla', symbol: 'TSLA', yahoo: 'TSLA' }
        ],
        etf: [
            { name: 'KODEX 200', symbol: '069500', yahoo: '069500.KS' },
            { name: 'TIGER 미국나스닥100', symbol: '133690', yahoo: '133690.KS' },
            { name: 'KODEX 삼성그룹', symbol: '102780', yahoo: '102780.KS' },
            { name: 'TIGER 2차전지테마', symbol: '305540', yahoo: '305540.KS' },
            { name: 'KODEX 미국S&P500TR', symbol: '379800', yahoo: '379800.KS' }
        ]
    };

    const newsData = [
        { title: '삼성전자, 1분기 영업이익 "어닝 서프라이즈" 기록', date: '2시간 전' },
        { title: '나스닥, 기술주 중심 강세로 사상 최고치 근접', date: '4시간 전' },
        { title: 'KODEX ETF 순자산 50조 돌파... 개인 투자자 유입 가속', date: '6시간 전' },
        { title: '미국 연준, 금리 인하 시점 고심... "물가 지표 확인 필요"', date: '8시간 전' },
        { title: '현대차-기아, 북미 전기차 점유율 확대 지속', date: '12시간 전' }
    ];

    const financialData = [
        { item: '매출액', y25: '305조', y24: '258조', y23: '302조' },
        { item: '영업이익', y25: '35조', y24: '6.5조', y23: '43조' },
        { item: '당기순이익', y25: '28조', y24: '15조', y23: '55조' },
        { item: 'ROE (%)', y25: '12.5', y24: '4.15', y23: '17.06' },
        { item: 'PER (배)', y25: '15.2', y24: '35.2', y23: '8.5' }
    ];

    const ctx = document.getElementById('mainChart').getContext('2d');
    let mainChart;

    async function fetchYahooData(yahooSymbol, range = '1d') {
        const interval = range === '1d' ? '5m' : (range === '1w' ? '30m' : '1d');
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}`)}`;
        try {
            const response = await fetch(proxyUrl);
            const rawData = await response.json();
            const data = JSON.parse(rawData.contents).chart.result[0];
            
            const meta = data.meta;
            const currentPrice = meta.regularMarketPrice;
            const prevClose = meta.previousClose || meta.chartPreviousClose;
            const change = currentPrice - prevClose;
            const changePercent = (change / prevClose) * 100;

            const timestamps = data.timestamp;
            const prices = data.indicators.quote[0].close;
            
            const labels = timestamps.map(ts => {
                const date = new Date(ts * 1000);
                return range === '1d' ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}` : `${date.getMonth() + 1}/${date.getDate()}`;
            });

            return {
                price: currentPrice.toLocaleString(),
                change: `${change > 0 ? '+' : ''}${change.toLocaleString()} (${change > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`,
                isUp: change >= 0,
                labels,
                data: prices
            };
        } catch (e) {
            console.error("Yahoo fetch error:", e);
        }
        return null;
    }

    function initChart() {
        mainChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ label: '주가', data: [], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.4, pointRadius: 0 }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
                    y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }

    function updateChartTheme() {
        const isLight = document.body.classList.contains('light-theme');
        const textColor = isLight ? '#64748b' : '#94a3b8';
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(148, 163, 184, 0.1)';
        mainChart.options.scales.x.ticks.color = textColor;
        mainChart.options.scales.y.ticks.color = textColor;
        mainChart.options.scales.y.grid.color = gridColor;
        mainChart.update();
    }

    function renderMarketCapList(type) {
        const list = document.getElementById('market-cap-list');
        const title = document.getElementById('list-title');
        list.innerHTML = '';
        const titles = { domestic: '국내 시가총액 상위', overseas: '해외 주요 종목', etf: '주요 ETF 리스트' };
        title.innerText = titles[type] || '시가총액 상위 10대 기업';

        const data = marketData[type] || marketData.domestic;
        data.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.name} <small style="color:var(--text-secondary)">${item.symbol}</small></span><span class="loading-text">로딩 중...</span>`;
            li.addEventListener('click', () => updateStockDetail(item));
            list.appendChild(li);
            
            // 리스트 개별 시세 로드
            fetchYahooData(item.yahoo, '1d').then(res => {
                if (res) {
                    li.querySelector('.loading-text').innerText = `${res.price} (${res.change.split(' ')[1]})`;
                    li.querySelector('.loading-text').className = res.isUp ? 'up' : 'down';
                }
            });
        });
    }

    async function updateStockDetail(item) {
        document.getElementById('stock-name').innerText = item.name;
        document.getElementById('stock-symbol').innerText = item.yahoo;
        
        const range = document.querySelector('.chart-controls button.active').dataset.range.toLowerCase();
        const res = await fetchYahooData(item.yahoo, range);
        
        if (res) {
            document.getElementById('current-price').innerText = res.price;
            const changeEl = document.getElementById('price-change');
            changeEl.innerText = res.change;
            changeEl.className = res.isUp ? 'up' : 'down';
            
            mainChart.data.labels = res.labels;
            mainChart.data.datasets[0].data = res.data;
            mainChart.data.datasets[0].borderColor = res.isUp ? '#ef4444' : '#3b82f6';
            mainChart.data.datasets[0].backgroundColor = res.isUp ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';
            mainChart.update();
        }
    }

    async function updateTicker() {
        const tickerItems = [
            { name: 'KOSPI', yahoo: '^KS11' },
            { name: 'KOSDAQ', yahoo: '^KQ11' },
            { name: 'NASDAQ', yahoo: '^IXIC' },
            { name: 'S&P 500', yahoo: '^GSPC' },
            { name: 'USD/KRW', yahoo: 'USDKRW=X' }
        ];
        const tickerContainer = document.querySelector('.ticker');
        tickerContainer.innerHTML = '';

        for (const item of tickerItems) {
            const tickerItem = document.createElement('div');
            tickerItem.className = 'ticker__item';
            tickerItem.innerHTML = `${item.name} <span>로딩 중...</span>`;
            tickerContainer.appendChild(tickerItem);

            fetchYahooData(item.yahoo, '1d').then(res => {
                if (res) {
                    tickerItem.innerHTML = `${item.name} <span class="${res.isUp ? 'up' : 'down'}">${res.price} (${res.change.split(' ')[1]})</span>`;
                }
            });
        }
    }

    const tabs = document.querySelectorAll('.sidebar nav li');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderMarketCapList(tab.dataset.tab);
        });
    });

    const rangeButtons = document.querySelectorAll('.chart-controls button');
    rangeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            rangeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const currentSymbol = document.getElementById('stock-symbol').innerText;
            let foundItem = null;
            Object.values(marketData).forEach(list => {
                const item = list.find(i => i.yahoo === currentSymbol);
                if (item) foundItem = item;
            });
            if (foundItem) updateStockDetail(foundItem);
        });
    });

    initChart();
    renderMarketCapList('domestic');
    updateTicker();
    updateStockDetail(marketData.domestic[0]);
    
    // 뉴스 및 재무 데이터 렌더링 (정적)
    const renderNews = () => {
        const list = document.getElementById('news-list');
        list.innerHTML = '';
        newsData.forEach(news => {
            const li = document.createElement('li');
            li.innerHTML = `${news.title}<span class="news-date">${news.date}</span>`;
            list.appendChild(li);
        });
    };
    const renderFinancials = () => {
        const body = document.getElementById('financial-body');
        body.innerHTML = '';
        financialData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="color:var(--text-secondary)">${row.item}</td><td>${row.y25}</td><td>${row.y24}</td><td>${row.y23}</td>`;
            body.appendChild(tr);
        });
    };
    renderNews();
    renderFinancials();
});



