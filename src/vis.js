/*
Filename: vis.js
About: A grid histogram showing GE 2017 results by median age
Author: Oliver Hawkins
Requires: d3 plus polyfills
*/

import "./libs/polyfill/array/keys.js";
import "./libs/polyfill/window/fetch.js";
import "./libs/polyfill/window/Promise.js";
import * as d3 from "d3";

// Global constants ----------------------------------------------------------

const FILE_CONS = "constituencies.csv";

// Functions: Visualisation setup --------------------------------------------

function setup(data) {

    const visa = buildChart("#visa", getPartyConfig(data));
    const visb = buildChart("#visb", getTurnoutConfig(data));
    const visc = buildChart("#visc", getLabourConfig(data));
    const visd = buildChart("#visd", getConservativeConfig(data));
}

// Chart building functions ---------------------------------------------------

function buildChart(div, config) {

    // Get Infobox
    const infobox = d3.select("#infobox");

    // Sizes and margins for the svg
    const margin = {top: 30, right: 30, bottom: 70, left: 30};
    const width = config.width - margin.left - margin.right;
    const height = config.height - margin.top - margin.bottom;

    // Create the title
    const title = d3.select(div)
        .append("p")
        .attr("class", "charttitle")
        .html(config.title)
        .append("p")
        .attr("class", "chartsubtitle")
        .html(config.subtitle);

    // Create the canvas svg element
    const vis = d3.select(div)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create the xscale
    const xscale = d3.scaleLinear()
        .domain([config.minMed - 1, config.maxMed + 1])
        .range([0, width]);

    // Create and append the x axis
    const xaxis = d3.axisBottom(xscale)
        .ticks(7);

    vis.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xaxis);

    vis.append("text")
        .attr("class", "axislabel")
        .attr("transform",
            `translate(${(width / 2)}, ${height + margin.top + 20})`)
        .style("text-anchor", "middle")
        .text("Median age");

    // Create the yscale
    const yscale = d3.scaleLinear()
        .domain([0, config.maxCount])
        .range([height, 0]);

    // Append the squares
    vis.selectAll(".square")
        .data(config.data)
        .enter()
        .append("rect")
        .attr("class", "square")
        .attr("x", d => {
            return xscale(d.xindex) -
                (((width / (config.maxMed - config.minMed)) - 2) / 2) + 1;
        })
        .attr("y", d => {
            return yscale(d.yindex + 1);
        })
        .attr("width", (width / (config.maxMed - config.minMed)) - 2)
        .attr("height", (height / config.maxCount + 1) - 2)
        .attr("fill", config.shadeFunc)
        .on("mouseover", (d, i, n) => {
            d3.select(n[i]).attr("fill", "#80ffff");
            showInfoBox(
                infobox,
                d.constituency,
                getFullPartyLabel(d),
                shadeLabelByParty(d),
                d.majority,
                config.showMajority,
                d.turnout,
                config.showTurnout);
        })
        .on("mouseout", (d, i, n) => {
            d3.select(n[i]).attr("fill", config.shadeFunc);
            hideInfoBox(infobox);
        })
        .on("click", (d, i, n) => {
            d3.select(n[i]).attr("fill", config.shadeFunc);
            hideInfoBox(infobox);
        });

    return vis;
}

// Configuration functions ----------------------------------------------------
function getConfig(data, sortFunc) {

    // Deep copy data
    data = JSON.parse(JSON.stringify(data));

    // Restructure the data into rows by median age
    const minMed = d3.min(data.map(d => +d.median_age));
    const maxMed = d3.max(data.map(d => +d.median_age));
    const cons = getConsByMedianAge(data, minMed, maxMed);

    // Get the maximum majority
    const maxMajority = d3.max(data.map(d => +d.majority));

    let maxCount = 0;
    cons.forEach(a => {
        if (a.length > maxCount) maxCount = a.length;
        a.sort(sortFunc);
        a.forEach((d, i) => {
            d.xindex = +d.median_age;
            d.yindex = i;
            d.majScore = +d.majority / maxMajority;
            d.turnout = +d.turnout;
        });
    });

    return {
        data,
        minMed,
        maxMed,
        maxCount
    };
}

function getPartyConfig(data) {
    const config = getConfig(data, compareByPartyAndMajorityAlt);
    config.width = 400;
    config.height = 646;
    config.maxCount = 49;
    config.showMajority = true;
    config.showTurnout = true;
    config.title = "Constituencies by party";
    config.subtitle = "650 seats";
    config.shadeFunc = (d) => {
        switch (d.party) {
            case "Con":
                return "#0a559d";
                break;
            case "Lab":
                return "#d20915";
                break;
            case "SNP":
                return "#fff58c";
            case "LD":
                return "#f89f31";
                break;
            case "DUP":
                return "#ca3415";
                break;
            case "SF":
                return "#0d665f";
                break;
            case "PC":
                return "#68b76b";
                break;
            case "Green":
                return "#008000";
                break;
            case "Spk":
                return "#909090";
                break;
            default:
                return "#c0c0c0";
        }
    };
    return config;
}

function getTurnoutConfig(data) {
    const turnoutScale = d3.scaleQuantize()
        .domain([0.5, 0.8])
        .range(d3.schemeBuGn[5]);
    const config = getConfig(data, compareByTurnout);
    config.width = 400;
    config.height = 646;
    config.maxCount = 49;
    config.showMajority = false;
    config.showTurnout = true;
    config.title = "Constituencies by turnout";
    config.subtitle = "Darker is higher";
    config.shadeFunc = (d) => {
        return turnoutScale(d.turnout);
    }
    return config;
}

function getLabourConfig(data) {
    const labScale = d3.scaleQuantize()
        .domain([0, 1])
        .range(d3.schemeReds[5])
    const con = data.filter(d => d.party == "Lab")
    const config = getConfig(con, compareByPartyAndMajorityAlt);
    config.width = 400;
    config.height = 445;
    config.minMed = 26;
    config.maxMed = 54;
    config.maxCount = 31;
    config.showMajority = true;
    config.showTurnout = false;
    config.title = "Labour seats by majority";
    config.subtitle = "Darker is higher";
    config.shadeFunc = (d) => {
        return labScale(d.majScore);
    }
    return config;
}

function getConservativeConfig(data) {
    const conScale = d3.scaleQuantize()
        .domain([0, 1])
        .range(d3.schemePuBu[5])
    const con = data.filter(d => d.party == "Con")
    const config = getConfig(con, compareByPartyAndMajorityAlt);
    config.width = 400;
    config.height = 445;
    config.minMed = 26;
    config.maxMed = 54;
    config.maxCount = 31;
    config.showMajority = true;
    config.showTurnout = false;
    config.title = "Conservative seats by majority";
    config.subtitle = "Darker is higher";
    config.shadeFunc = (d) => {
        return conScale(d.majScore);
    }
    return config;
}

// Grouping functions ---------------------------------------------------------

function getConsByMedianAge(data, minMed, maxMed) {
    const index = [...Array(maxMed - minMed + 1).keys()];
    const cons = index.map(i => new Array());
    data.forEach(d => cons[d.median_age - minMed].push(d));
    return cons;
}

// Sorting functions ----------------------------------------------------------

function compareByParty(a, b) {
    const ranks = ["Con", "Lab", "SNP", "LD", "DUP",
        "SF", "PC", "Green", "Ind", "Spk"]
    const ar = ranks.indexOf(a.party)
    const br = ranks.indexOf(b.party)
    return ar - br
}

function compareByPartyAlt(a, b) {
    const ranks = ["Lab", "Con", "SNP", "LD", "DUP",
        "SF", "PC", "Green", "Ind", "Spk"]
    const ar = ranks.indexOf(a.party)
    const br = ranks.indexOf(b.party)
    return ar - br
}

function compareByPartyAndMajority(a, b) {
    const ranks = ["Con", "Lab", "SNP", "LD", "DUP",
        "SF", "PC", "Green", "Ind", "Spk"]
    const ar = ranks.indexOf(a.party)
    const br = ranks.indexOf(b.party)
    if (ar - br == 0) {
        return (+a.majority - +b.majority) * -1;
    } else {
        return ar - br;
    }
}

function compareByPartyAndMajorityAlt(a, b) {
    const ranks = ["Lab", "Con", "SNP", "LD", "DUP",
        "SF", "PC", "Green", "Ind", "Spk"]
    const ar = ranks.indexOf(a.party)
    const br = ranks.indexOf(b.party)
    if (ar - br == 0) {
        return (+a.majority - +b.majority) * -1;
    } else {
        return ar - br;
    }
}

function compareByTurnout(a, b) {
    return (+a.turnout - +b.turnout) * -1;
}

// Infobox functions ----------------------------------------------------------

function showInfoBox(infobox, constituency, party, highlight,
    majority, showMajority, turnout, showTurnout) {

    const boxHeight = infobox.node().getBoundingClientRect().height;
    const partyLabel = (party) ? " (" + party + ")" : "";

    let html = `<p class="constituency">${constituency}</p>
        <p class="party" style="color: ${highlight};">${party}</p>`;

    if (showMajority) {
        html = `${html}<p>Majority: ${numberWithCommas(majority)}</p>`;
    }

    if (showTurnout) {
        html = `${html}<p>Turnout: ${(turnout * 100).toFixed(1)}%</p>`;
    }

    infobox.transition()
        .duration(150)
        .style("opacity", .95);

    infobox.html(html)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - boxHeight) + "px");
}

function hideInfoBox(infobox) {
    infobox.transition()
        .duration(300)
        .style("opacity", 0);
}

// Labelling Functions --------------------------------------------------------

function getFullPartyLabel(d) {
    switch (d.party) {
        case "Con":
            return "Conservative";
            break;
        case "Lab":
            return "Labour";
            break;
        case "SNP":
            return "Scottish National Party";
        case "LD":
            return "Liberal Democrat";
            break;
        case "DUP":
            return "DUP";
            break;
        case "SF":
            return "Sinn Fein";
            break;
        case "PC":
            return "Plaid Cymru";
            break;
        case "Green":
            return "Green";
            break;
        case "Spk":
            return "Speaker";
            break;
        case "Ind":
            return "Indpendent";
            break;
        default:
            return "Unknown";
    }
}

function shadeLabelByParty(d) {
    switch (d.party) {
        case "Con":
            return "#0a559d";
            break;
        case "Lab":
            return "#d20915";
            break;
        case "SNP":
            return "#ffd060";
        case "LD":
            return "#f89f31";
            break;
        case "DUP":
            return "#ca3415";
            break;
        case "SF":
            return "#0d665f";
            break;
        case "PC":
            return "#68b76b";
            break;
        case "Green":
            return "#008000";
            break;
        case "Spk":
            return "#909090";
            break;
        default:
            return "#c0c0c0";
    }
}

function numberWithCommas(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Global execution -----------------------------------------------------------

d3.csv(FILE_CONS).then(data => setup(data));
