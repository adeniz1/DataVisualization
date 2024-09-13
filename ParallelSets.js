function transformDataForParallelSets(data) {
    data.forEach(d => {
        // Kombinieren von Variable: BachelorOrMaster und Study in Studystatus Variable
        d.Studystatus = d.BachelorOrMaster + '-' + d.Study;
    });
    return data;
}

//berechnet die Anzahl der Studenten die einen Variablenwert von einem Attribut auf den Achsen annehmen
function calculateFrequencies(data, attributeOrder) {
    let frequencies = {};
    attributeOrder.forEach(attribute => {
        frequencies[attribute] = {};
        data.forEach(d => {
            let value = d[attribute];
            if (!frequencies[attribute][value]) {
                frequencies[attribute][value] = 1;
            } else {
                frequencies[attribute][value]++;
            }
        });
    });
    return frequencies;
}

//fügt den Achsen Labels hinzu und ermöglicht das Hovern über die Labels
function addAxisLabels(attributeOrder,data) {
  
    const existingLabels = document.querySelectorAll('.axis-label');
    existingLabels.forEach(label => label.remove());

    const axis0Label = createAxisLabel(attributeOrder[0], '0%', 'axis-label');
    canvas.appendChild(axis0Label);
    const axis1Label = createAxisLabel(attributeOrder[1], '31%', 'axis-label');
    canvas.appendChild(axis1Label);
    const axis2Label = createAxisLabel(attributeOrder[2], '63%', 'axis-label');
    canvas.appendChild(axis2Label);
    const axis3Label = createAxisLabel(attributeOrder[3], '93%', 'axis-label');
    canvas.appendChild(axis3Label);

    const frequencies = calculateFrequencies(data,attributeOrder);
    console.log(frequencies);

    const labels = document.querySelectorAll('.axis-label');
    labels.forEach(label => {
        label.addEventListener('mouseover', function() {
            showTooltip(label, frequencies[label.textContent]);
        });
        label.addEventListener('mouseout', function() {
            hideTooltip();
        });  
    });
}

function showTooltip(label, frequency) {
    let tooltipHtml = '';
    for (let key in frequency) {
        if (frequency.hasOwnProperty(key)) {
            tooltipHtml += `${key}: ${frequency[key]}<br>`; // <br> für Zeilenumbrüche 
        }
    }
    let tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.left = label.style.left;
    tooltip.style.top = '110%';
    tooltip.style.backgroundColor = 'lightgray';
    tooltip.style.padding = '10px';
    tooltip.style.border = '1px solid black';
    tooltip.style.borderRadius = '5px';
    tooltip.style.whiteSpace = 'pre-line'; 
    tooltip.innerHTML = tooltipHtml; 
    label.appendChild(tooltip);
}

function hideTooltip() {
    let tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

function createAxisLabel(text, leftPosition, className) {
    const label = document.createElement('div');
    label.textContent = text;
    label.className = className; 
    label.style.position = 'absolute';
    label.style.fontFamily = "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif";
    label.style.left = leftPosition;
    label.style.top = '105%';
    return label;
}

//gibt die Attributereihenfolge zurück, die durch den Benutzer durch das Drop-Down Menü definiert wurde
function getAttributeOrder(){
    const axis2 = document.getElementById('axis2').value ;
    const axis3 = document.getElementById('axis3').value ;
    const axis4 = document.getElementById('axis4').value ;
    return  ['Bestanden?', axis2, axis3, axis4] ;
}

function draw(two,attributeOrder){
    d3.csv('DesignuebungGradingData_1.csv').then(rawData => {
        const data = transformDataForParallelSets(rawData); //verbindet die Variablen BachelorOrMaster und Study
        filterDataAndDrawVis(data,two);
    })
}

/* zeichnet ParallelSets nach der vom Benutzer bestimmten Achsenreihenfolge und den gefilterten Daten indem er drawParallelSets aufruft*/
function drawVis(data,two, attributeOrder,frequencies){
    const color = d3.scaleOrdinal(["ja", "nein"], ['rgb(0, 200, 0)', 'rgb(238, 59, 59)']); // Farbe der Fläche die angezeigt wird
    const highlightColor = d3.scaleOrdinal(["ja", "nein"], ['rgb(0, 100, 0)', 'rgb(139, 0, 0)']); // Farbe wenn auf Fläche gehovert wird
    if (attributeOrder[1] === attributeOrder[2] || attributeOrder[1] === attributeOrder[3] || attributeOrder[2] === attributeOrder[3] ) {
        alert("Ups! Fehler... 🙃 Zwei oder mehr ausgewählte Achsen sind gleich. Bitte wähle unterschiedliche Werte für die Achsen!");
        return; 
    }
    const combinationCounts = calculateAttributeValueCombinationCounts(data);
    frequencies= calculateFrequencies(data,attributeOrder);
    drawParallelSets(combinationCounts, attributeOrder, color, two, highlightColor,frequencies);
    console.log(combinationCounts);
    addAxisLabels(attributeOrder,data);
   

}


/* filtert die Daten nach dem Kurs (je nachdem was durch den Benutzer gewählt wurde) und ruft drawVis auf*/
function filterDataAndDrawVis(data, two){
    document.getElementById("drawParSet").addEventListener("click", function(){
    
        var selectedCourseValue = document.getElementById("DropDownCourse").value;
       /* var selectedCategorizedTimeValue = document.getElementById("DropDownCategorizedTime").value;*/

        var filteredData ;

        if(selectedCourseValue !== "beide") {
            filteredData = data.filter (d => d.Course === selectedCourseValue);
        } else {
            filteredData = data;
        }

        console.log(filteredData);
        const attributeOrder = getAttributeOrder();
        drawVis(filteredData,two,attributeOrder);
    })
}

// Funktion aus Übungsblatt 6 um die Anzahl der Studenten zu zählen die Kombinationen von Variablenwerten annehmen
    function calculateAttributeValueCombinationCounts(data) {
        const combinationByNames = new Map(); 
        const combinationCounts = [];
    data.forEach(d => {
            const key = JSON.stringify(d); 
            if (!combinationByNames.has(key)) { 
                let dCopy = _.cloneDeep(d); 
                dCopy.value = 1; 
                combinationCounts.push(dCopy); 
                combinationByNames.set(key, combinationCounts.length - 1) 
            } else {
                combinationCounts[combinationByNames.get(key)].value += 1; 
            }
        })
        return combinationCounts;
    }

    //Funktion aus Übungsblatt 6 
    //two.clear und two.update hinzugefügt damit bei jeder Änderung der Achsenreihenfolge und Kurs das Parallel Sets 
    //sich aktualisieren kann undneu erstellt werden kann
    function drawParallelSets(combinationCounts, attributeOrder, color, two,highlightColor,frequencies) {
        two.clear();
        const graph = prepareGraphData(combinationCounts, attributeOrder); 
        const graphCopy = _.cloneDeep(graph); // deep copy of the graph
        const sankey = getSankeyGenerator(two.width, two.height, graphCopy.nodes, graphCopy.links) //get sankey generator
        const { nodes, links } = sankey(); // call generator
        drawSankeyDiagram(two, nodes, links, color,combinationCounts,highlightColor,frequencies); //draw chart

        const svg = d3.select('#canvas').append('svg')
        .attr('width', two.width).attr('height',two.height);

        two.update();  
    } 

    