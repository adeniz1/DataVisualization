"use strict";
const isAnimated = false ;

//Initalisierung der Website aus den Übungsaufgaben
function initialiseWebpage(params) {
    // setup webpage with all needed elements, e.g. creating the title and the canvas to draw on etc.
    const main = document.getElementById("main");

    const subTitle = document.createElement("h2");
    subTitle.style.fontFamily = "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif";
    subTitle.style.textAlign = "center";
    subTitle.textContent = "Bestandene und Nicht Bestandene Studenten: Wie unterscheiden die sich voneinander?"
    subTitle.style.fontSize = "38px";
    main.appendChild(subTitle);

    const subTitle2 = document.createElement("h2");
    subTitle2.style.fontFamily = "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif";
    subTitle2.style.textAlign = "center";
    subTitle2.textContent = "Daten bereitgestellt von: VisVa Lehrstuhl Universität zu Köln"
    subTitle2.style.fontSize = "38px";
    main.appendChild(subTitle2);


    const canvas = document.createElement("div");
    canvas.id = "canvas";
    canvas.style.width = params.width + "px";
    canvas.style.height = params.height + "px";
    canvas.style.margin = "8rem auto";
    canvas.style.position = 'relative';
    main.appendChild(canvas);

    const subTitle3 = document.createElement("h2");
    subTitle3.style.fontFamily = "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif";
    subTitle3.style.textAlign = "center";
    subTitle3.textContent = "Tipp: Durch das Hovern über die Flächen und Achsenbeschriftungen kannst du mehr Infos erhalten!😊 "
    subTitle3.style.fontSize = "25px";
    main.appendChild(subTitle3);


    return canvas;
}

function main() {
    if (document.getElementById("canvas")) return; //already initialised
    const params = {
        width: 1300,
        height: 800
    };
    const canvas = initialiseWebpage(params);
    //this is how to setup two.js for further information look into https://two.js.org/
    const two = new Two(params);
    two.appendTo(canvas);

    draw(two);

    /* If Vis is Animated then two.play(). Otherwise two.update()*/
    if (isAnimated) two.play();
    else two.update();

}



/*Funktion aus Übungsblatt 6 Aufgabe 6.2 */
// um Nodes (Knoten) und Links (Verbindungen  zwischen den Knoten) zu bestimmen
function prepareGraphData(data, keys) {
    let index = -1;
    const nodes = [];
    const nodeByKey = new Map; 
    const indexByKey = new Map; 
    const links = [];

    for (const k of keys) { 
        for (const d of data) { 
            const key = JSON.stringify([k, d[k]]); // https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
            if (nodeByKey.has(key)) {
                continue;
            }
            const node = { name: d[k] }; 
            nodes.push(node);
            
            nodeByKey.set(key, node);
            indexByKey.set(key, ++index);
        }
    }

    for (let i = 1; i < keys.length; ++i) { 
        const a = keys[i - 1];
        const b = keys[i]; 
        const prefix = keys.slice(0, i + 1); 
        const linkByKey = new Map; 
        for (const d of data) { 
            const names = prefix.map(k => d[k]);
            const key = JSON.stringify(names);
            const value = d.value;
            if (linkByKey.has(key)) { 
                let link = linkByKey.get(key);
                link.value += value;
            } else { 
                let link = {
                    source: indexByKey.get(JSON.stringify([a, d[a]])),
                    target: indexByKey.get(JSON.stringify([b, d[b]])),
                    names,
                    value
                };
                links.push(link);
                linkByKey.set(key, link);
            }
        }
    }


    return { nodes, links };
}

/**
 * Given a list of nodes and links, returns a sankey generator.
 * For more information have a look at https://github.com/d3/d3-sankey.
 */
/*aus Übungsblatt 6 Aufgabe 6.2*/
function getSankeyGenerator(width, height, nodes, links) {
    let sankey = d3.sankey() 
        .nodeWidth(3) 
        .linkSort((a, b) => { 
            let nameA;
            let nameB;
    
            for (let i = 0; i < a.names.length; i++) {
                nameA = a.names[i];
                nameB = b.names[i];
                if (nameA !== nameB) {
                    break;
                }
            }
            if (nameA > nameB) { 
                return 1;
            } else if (nameA < nameB) {
                return -1;
            } else {
                return 0;
            }
        })

        .nodePadding(25) 
        .size([width, height]) 
        .nodes(nodes) 
        .links(links); 
         return sankey; 
}



/*Aus Aufgabe 6.Übungsblatt,jedoch bisschen modifiziert um Aufgabe zu erfüllen */
function drawSankeyDiagram(two, nodes, links, color, combinationsCounts, highlightColor,frequencies) {

    let totalPassed = combinationsCounts.filter(d => d["Bestanden?"] === "ja").reduce((sum, d) => sum + d.value, 0); //Summe der bestandenen Studenten
    let totalFailed = combinationsCounts.filter(d => d["Bestanden?"] === "nein").reduce((sum, d) => sum + d.value, 0); //Summe der nicht Bestandenen Studenten

    let totalStudents  = frequencies["Bestanden?"]["nein"]+ frequencies["Bestanden?"]["ja"];
    

    const svg = d3.select('svg');
    svg.selectAll("*").remove();
    // draw all the nodes as rectangles
    svg.append("g")
        .selectAll("rect")
        .data(nodes) 
        .join("rect") 
        .attr("x", d => d.x0) 
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0 + 1);

    svg.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => color(d.names[0]))
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("stroke-opacity", 0.6)
        .style("mix-blend-mode", "multiply")
        .on("mouseover", linkMouseOver)
        .on("mouseout", linkMouseOut)
        .append("title")
        .text(d => {
            const percentage = (d.value / (totalStudents) * 100).toFixed(2);
            let total = d.names.includes("ja") ? totalPassed : totalFailed;
            let totalName = d.names.includes("ja") ? "Bestandenen Studenten" : "Nicht Bestandenen Studenten"
            const percentage2 = (d.value / total * 100).toFixed(2);
            return `${d.names.join(" → ")}\n${d.value} von ${totalStudents} Studenten (${percentage}%) \n${d.value} von ${total} ${totalName}  (${percentage2}%)  `;
        });

    function linkMouseOver(event, d) {
        const hoveredAttributes = d.names;
        //hoveredAttributes enthält die Attributwerte des gehoverten Link
        // Hervorheben des gehoverten Links und aller Links, die diesen Link in ihrer Sequenz enthalten
        svg.selectAll(".link")
            .filter(link => {
                return link.names.slice(0, hoveredAttributes.length).join("-") === hoveredAttributes.join("-");
            })
            .attr("stroke", link => highlightColor(link.names[0]))
            .attr("stroke-opacity", 1.0);
    }

    function linkMouseOut(event, d) {
        svg.selectAll(".link")
            .attr("stroke", link => color(link.names[0])) // Zurücksetzen auf die normale Farbskala
            .attr("stroke-opacity", 0.6);
    }

    // add labels to the nodes
    svg.append("g")
        .style("font", "14px Arial")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("x", d => d.x0 < two.width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < two.width / 2 ? "start" : "end") //text anchor switching position halfway, no extra margin needed this way.
        .text(d => d.name) //add the name
        .append("tspan") //add a tspan (subtext) within the text element, allows for different styling
        .attr("fill-opacity", 1.0)
}


main();









