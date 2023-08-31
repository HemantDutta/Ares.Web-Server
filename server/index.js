const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const cors = require('cors');
const port = 5000;

app.use(cors());

app.listen(port, () => {
    console.log("Server is listening on port: ", port);
});

app.get("/", (req, res) => {
    res.send(`<h1>Ares.Web Server</h1>`);
});


//Scraping News From The Verge
app.get("/verge-scraping", async (req, res) => {
    let userSearch = req.query.search;
    let temp_words = userSearch.split(" ");
    userSearch = temp_words[0];
    for (let i = 1; i < temp_words.length; i++) {
        userSearch += "%20";
        userSearch += temp_words[i];
    }
    const url = `https://www.theverge.com/search?q=${userSearch}`;
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto(url, {timeout: 0});
    await autoScroll(page, 50);
    const titleData = await page.evaluate(() => {
        const titles = Array.from(document.querySelectorAll(".max-w-container-md")).slice(1,);
        return titles.map((news) => ({
            title: news.querySelector("h2 a").innerText.substring(0, 66) + "...",
            link: "https://www.theverge.com/" + news.querySelector("h2 a").getAttribute("href"),
            desc: news.querySelector(".duet--article--dangerously-set-cms-markup").innerText.substring(0, 122) + "...",
            imgSrc: news.querySelector("div.aspect-square a span img").getAttribute("src"),
            from: "The Verge",
            color: "verge"
        }));
    })
    res.header("Set-Cookie", "HttpOnly;Secure;SameSite=None");
    res.send(titleData);
    await browser.close();
});

//Scraping news from WIRED
app.get("/vb-scraping", async (req, res) => {
    let userSearch = req.query.search;
    let temp_words = userSearch.split(" ");
    userSearch = temp_words[0];
    for (let i = 1; i < temp_words.length; i++) {
        userSearch += "+";
        userSearch += temp_words[i];
    }
    const url = `https://venturebeat.com/?s=${userSearch}`;
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto(url);
    await autoScroll(page, 50);
    const titleData = await page.evaluate(() => {
        const titles = Array.from(document.querySelectorAll(".ArticleListing:not(.ArticleListing--featured):not(.ArticleListing--pr):not(.ArticleListing--s)")).slice(0,10);
        return titles.map((news) => ({
            title: news.querySelector(".ArticleListing__title a").innerText,
            link: news.querySelector(".ArticleListing__image-link").getAttribute("href"),
            desc: "By " + news.querySelector(".ArticleListing__byline a").innerText + `, Published on: ` + news.querySelector(".ArticleListing__time").innerText,
            imgSrc: news.querySelector(".ArticleListing__image-link img").getAttribute("src"),
            from: "VentureBeat",
            color: "vb"
        }));
    })
    res.header("Set-Cookie", "HttpOnly;Secure;SameSite=None");
    res.send(titleData);
    await browser.close();
});

//Feed Headline techNewsWorld
app.get("/feed-headline", async (req,res)=>{
    const url = "https://techcrunch.com/";
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto(url, {timeout: 0});
    const news = await page.evaluate(()=> {
        const newsHead = Array.from(document.querySelectorAll(".feature-island-main-block"));
        return newsHead.map((x)=>({
            title: x.querySelector("h2.fi-main-block__title a").innerText,
            link: "https://techcrunch.com" +  x.querySelector("h2.fi-main-block__title a").getAttribute("href"),
            desc: (x.querySelector("h3.fi-main-block__subtitle")) ?x.querySelector("h3.fi-main-block__subtitle").innerText : "",
            imgSrc: x.querySelector("figure.post-block__media img").getAttribute("src"),
            from: "TechCrunch"
        }));
    });
    res.header("Set-Cookie", "HttpOnly;Secure;SameSite=None");
    res.send(news);
    await browser.close();
});

//Feed Content techNewsWorld
app.get("/feed-content", async (req,res)=>{
    const url = "https://techcrunch.com/";
    const browser = await puppeteer.launch({headless: true, defaultViewport: {
            width:1920,
            height:1080
        }});
    const page = await browser.newPage();
    await page.goto(url, {timeout: 0});
    await autoScroll(page, 50);
    const news = await page.evaluate(()=>{
        const newsFeed = Array.from(document.querySelectorAll("article.post-block:not(.post-block--premium-content):not(.post-block--featured)"));
        return newsFeed.map((x)=>({
            title: x.querySelector("header.post-block__header h2.post-block__title a.post-block__title__link").innerText,
            link: "https://techcrunch.com" + x.querySelector("header.post-block__header h2.post-block__title a.post-block__title__link").getAttribute("href"),
            desc: x.querySelector(".post-block__content").innerText,
            imgSrc: x.querySelector("figure.post-block__media img").getAttribute("src"),
            from: "TechCrunch"
        }));
    });
    res.header("Set-Cookie", "HttpOnly;Secure;SameSite=None");
    res.send(news);
    await browser.close();
});

//Scroll Entire Page to avoid lazy loading images
async function autoScroll(page, maxScrolls) {
    await page.evaluate(async (maxScrolls) => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 100;
            let scrolls = 0;  // scrolls counter
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrolls++;
                if (totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    }, maxScrolls);
}