document.addEventListener('DOMContentLoaded', () => {
    // 테마 토글
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeToggle.innerHTML = document.body.classList.contains('light-theme') 
            ? '<i class="fas fa-sun"></i> 라이트 모드' 
            : '<i class="fas fa-moon"></i> 다크 모드';
        updateChartTheme();
    });

    // 데이터 초기화 (심볼 정보 업데이트)
    const marketData = {
        domestic: [
            { name: '삼성전자', symbol: '005930', google: '005930:KRX', yahoo: '005930.KS', price: '219,500', change: '-2.23%', cap: '1,298조' },
            { name: 'SK하이닉스', symbol: '000660', google: '000660:KRX', yahoo: '000660.KS', price: '1,130,500', change: '+2.12%', cap: '822조' },
            { name: 'LG에너지솔루션', symbol: '373220', google: '373220:KRX', yahoo: '373220.KS', price: '416,000', change: '-0.50%', cap: '97조' },
            { name: '삼성바이오로직스', symbol: '207940', google: '207940:KRX', yahoo: '207940.KS', price: '1,601,000', change: '+0.10%', cap: '113조' },
            { name: '현대차', symbol: '005380', google: '005380:KRX', yahoo: '005380.KS', price: '537,500', change: '+0.66%', cap: '112조' }
        ],
        overseas: [
            { name: 'Apple Inc.', symbol: 'AAPL', google: 'AAPL:NASDAQ', yahoo: 'AAPL', price: '263.40', change: '+1.14%', cap: '$4.12T' },
            { name: 'Microsoft', symbol: 'MSFT', google: 'MSFT:NASDAQ', yahoo: 'MSFT', price: '420.26', change: '+2.20%', cap: '$3.12T' },
            { name: 'NVIDIA', symbol: 'NVDA', google: 'NVDA:NASDAQ', yahoo: 'NVDA', price: '198.14', change: '+1.00%', cap: '$4.89T' },
            { name: 'Alphabet A', symbol: 'GOOGL', google: 'GOOGL:NASDAQ', yahoo: 'GOOGL', price: '337.12', change: '+0.33%', cap: '$4.17T' },
            { name: 'Tesla', symbol: 'TSLA', google: 'TSLA:NASDAQ', yahoo: 'TSLA', price: '388.90', change: '-0.78%', cap: '$1.23T' }
        ],
        etf: [
            { name: 'KODEX 200', symbol: '069500', google: '069500:KRX', yahoo: '069500.KS', price: '82,450', change: '-0.48%', cap: '6.5조' },
            { name: 'TIGER 미국나스닥100', symbol: '133690', google: '133690:KRX', yahoo: '133690.KS', price: '156,200', change: '+0.36%', cap: '3.2조' },
            { name: 'KODEX 삼성그룹', symbol: '102780', google: '102780:KRX', yahoo: '102780.KS', price: '15,850', change: '-0.10%', cap: '1.8조' },
            { name: 'TIGER 2차전지테마', symbol: '305540', google: '305540:KRX', yahoo: '305540.KS', price: '25,400', change: '-1.50%', cap: '1.2조' },
            { name: 'KODEX 미국S&P500TR', symbol: '379800', google: '379800:KRX', yahoo: '379800.KS', price: '22,800', change: '+0.26%', cap: '0.9조' }
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

    // 차트 생성
    const ctx = document.getElementById('mainChart').getContext('2d');
    let mainChart;

    async function fetchRealTimePrice(googleSymbol) {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.google.com/finance/quote/${googleSymbol}`)}`;
        try {
            const response = await fetch(proxyUrl);
            const data = await response.json();
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            
            // 구글 파이낸스 가격 및 변동률 셀렉터 (변동 가능)
            const priceEl = doc.querySelector('.YMlS1d');
            const changeEl = doc.querySelector('.Jw7Xdb');
            
            if (priceEl && changeEl) {
                return {
                    price: priceEl.innerText.replace('₩', '').trim(),
                    change: changeEl.innerText.trim()
                };
            }
        } catch (e) {
            console.error("Price fetch error:", e);
        }
        return null;
    }

    async function fetchChartData(yahooSymbol, range = '1d') {
        const interval = range === '1d' ? '5m' : (range === '1w' ? '30m' : '1d');
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}`)}`;
        try {
            const response = await fetch(proxyUrl);
            const data = await response.json();
            const result = JSON.parse(data.contents).chart.result[0];
            
            const timestamps = result.timestamp;
            const prices = result.indicators.quote[0].close;
            
            const labels = timestamps.map(ts => {
                const date = new Date(ts * 1000);
                return range === '1d' ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}` : `${date.getMonth() + 1}/${date.getDate()}`;
            });

            return { labels, data: prices };
        } catch (e) {
            console.error("Chart fetch error:", e);
        }
        return null;
    }

    function initChart() {
        mainChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '주가',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
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

    // 데이터 렌더링 함수들
    function renderMarketCapList(type) {
        const list = document.getElementById('market-cap-list');
        const title = document.getElementById('list-title');
        list.innerHTML = '';
        
        const titles = { domestic: '국내 시가총액 상위', overseas: '해외 주요 종목', etf: '주요 ETF 리스트' };
        title.innerText = titles[type] || '시가총액 상위 10대 기업';

        const data = marketData[type] || marketData.domestic;
        data.forEach(item => {
            const li = document.createElement('li');
            const isUp = item.change.includes('+');
            li.innerHTML = `
                <span>${item.name} <small style="color:var(--text-secondary)">${item.symbol}</small></span>
                <span class="${isUp ? 'up' : 'down'}">${item.price} (${item.change})</span>
            `;
            li.addEventListener('click', () => updateStockDetail(item));
            list.appendChild(li);
        });
    }

    function renderNews() {
        const list = document.getElementById('news-list');
        list.innerHTML = '';
        newsData.forEach(news => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${news.title}
                <span class="news-date">${news.date}</span>
            `;
            list.appendChild(li);
        });
    }

    function renderFinancials() {
        const body = document.getElementById('financial-body');
        body.innerHTML = '';
        financialData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:var(--text-secondary)">${row.item}</td>
                <td>${row.y25}</td>
                <td>${row.y24}</td>
                <td>${row.y23}</td>
            `;
            body.appendChild(tr);
        });
    }

    async function updateStockDetail(item) {
        document.getElementById('stock-name').innerText = item.name;
        document.getElementById('stock-symbol').innerText = item.google || item.symbol;
        
        // 실시간 데이터 패치
        const realTime = await fetchRealTimePrice(item.google);
        if (realTime) {
            document.getElementById('current-price').innerText = realTime.price;
            const changeEl = document.getElementById('price-change');
            changeEl.innerText = realTime.change;
            changeEl.className = realTime.change.includes('+') ? 'up' : 'down';
        } else {
            document.getElementById('current-price').innerText = item.price;
            const changeEl = document.getElementById('price-change');
            changeEl.innerText = item.change;
            changeEl.className = item.change.includes('+') ? 'up' : 'down';
        }
        
        // 차트 데이터 패치
        const range = document.querySelector('.chart-controls button.active').dataset.range.toLowerCase();
        const chartData = await fetchChartData(item.yahoo, range);
        
        if (chartData) {
            mainChart.data.labels = chartData.labels;
            mainChart.data.datasets[0].data = chartData.data;
            const isUp = (realTime ? realTime.change : item.change).includes('+');
            mainChart.data.datasets[0].borderColor = isUp ? '#ef4444' : '#3b82f6';
            mainChart.data.datasets[0].backgroundColor = isUp ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';
            mainChart.update();
        }
    }

    // 탭 이벤트
    const tabs = document.querySelectorAll('.sidebar nav li');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderMarketCapList(tab.dataset.tab);
        });
    });

    // 차트 기간 조절 이벤트
    const rangeButtons = document.querySelectorAll('.chart-controls button');
    rangeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            rangeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 현재 선택된 종목 다시 로드
            const currentSymbol = document.getElementById('stock-symbol').innerText;
            // 리스트에서 해당 심볼 찾기
            let foundItem = null;
            Object.values(marketData).forEach(list => {
                const item = list.find(i => i.google === currentSymbol || i.symbol === currentSymbol);
                if (item) foundItem = item;
            });
            if (foundItem) updateStockDetail(foundItem);
        });
    });

    // 티커 업데이트 함수
    async function updateTicker() {
        const tickerItems = [
            { id: 'ticker-kospi', name: 'KOSPI', google: 'INDEXKRX:KOSPI' },
            { id: 'ticker-kosdaq', name: 'KOSDAQ', google: 'INDEXKRX:KOSDAQ' },
            { id: 'ticker-nasdaq', name: 'NASDAQ', google: 'INDEXNASDAQ:.IXIC' },
            { id: 'ticker-sp500', name: 'S&P 500', google: 'INDEXSP:.INX' },
            { id: 'ticker-usdkrw', name: 'USD/KRW', google: 'CURRENCY:USDKRW' }
        ];

        const tickerContainer = document.querySelector('.ticker');
        tickerContainer.innerHTML = ''; // 초기화

        for (const item of tickerItems) {
            const data = await fetchRealTimePrice(item.google);
            const tickerItem = document.createElement('div');
            tickerItem.className = 'ticker__item';
            
            if (data) {
                const isUp = data.change.includes('+');
                tickerItem.innerHTML = `${item.name} <span class="${isUp ? 'up' : 'down'}">${data.price} (${data.change})</span>`;
            } else {
                tickerItem.innerHTML = `${item.name} <span>로딩 중...</span>`;
            }
            tickerContainer.appendChild(tickerItem);
        }
    }

    // 초기 실행
    initChart();
    renderMarketCapList('domestic');
    renderNews();
    renderFinancials();
    updateTicker();

    // 초기 종목(삼성전자) 로드
    updateStockDetail(marketData.domestic[0]);
});


