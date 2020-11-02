class Stopwatch
{
    constructor(immediatestart)
    {
        this.starttime = null;
        this.stoptime = null;
        if(immediatestart == true)
        {
            this.starttime = new Date().getTime();
        }
    }

    start()
    {
        this.starttime = new Date().getTime();
        this.stoptime = null;
    }

    stop()
    {
        this.stoptime = new Date().getTime();
        if(this.starttime == null) return null;
        return this.stoptime - this.starttime;
    }

    getElapsedTime()
    {
        let tmp = this.stoptime;
        if(this.starttime == null) return null;
        if(this.stoptime == null) tmp = new Date().getTime();
        return tmp - this.starttime;
    }
}

function points_draw(canvas, points)
{
    if (points)
    {
        for (var i = 0; i < points.length; i++)
        {
            var p = points[i];
            var centerX = p.x * canvas.xscale + 0.5;
            var centerY = p.y * canvas.yscale + 0.5;
            var ctx = canvas.ctx;
            ctx.fillStyle = "#C06060";
            ctx.beginPath();
            ctx.arc(centerX, centerY, 3, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
    }
}

sw = new Stopwatch(true);
numpoints = 100;

function node_draw(canvas, node)
{
    var size = 3;
    var centerX = node.x * canvas.xscale + 0.5 - size / 2;
    var centerY = node.y * canvas.yscale + 0.5 - size / 2;
    var ctx = canvas.ctx;
    ctx.fillStyle = "red";
    ctx.fillRect(centerX, centerY, size, size);
    if (node.next != null)
    {
        ctx.lineTo(
            node.next.x * canvas.xscale + 0.5,
            node.next.y * canvas.yscale + 0.5
        );
    }
}

function paint_tsp(tsp)
{
    if (!canvas)
    {
        return;
    }
    canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
    points_draw(canvas, tsp.points);

    if (tsp.neurons)
    {
        canvas.ctx.strokeStyle = "#80D080";
        canvas.ctx.beginPath();
        var n = tsp.neurons.start;
        canvas.ctx.moveTo(
            n.x * canvas.xscale + 0.5,
            n.y * canvas.yscale + 0.5
        );
        for (i = 0; i < tsp.neurons.length; i++)
        {
            node_draw(canvas, n);
            n = n.next;
        }
        canvas.ctx.lineWidth = 1;
        canvas.ctx.stroke();
        canvas.ctx.closePath();
    }
}

function Canvas(elem)
{
    this.elem = elem;
    this.ctx = elem.getContext("2d");
    this.height = elem.height;
    this.width = elem.width;
    this.xscale = this.width;
    this.yscale = this.height;
}

function createPoints()
{
    numpoints = $("#points").val();
    var pts = [];

    for (let i = 0; i < numpoints; i++)
    {
        pts.push(new Point2D(Math.random(), Math.random()));
    }
    tsp.setPoints(pts);

    canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
    points_draw(canvas, tsp.points);
}

function setupForm(tsp)
{
    $("#points").val(numpoints);
    $("#maxCycles").val(tsp.maxCycles);
    $("#alpha").val(tsp.alpha);
    $("#gain").val(tsp.gain);
    $("#createPoints").bind("click", createPoints)
    $("#runAsync").bind("click", function (event)
    {
        updateButtons(true);
        if(tsp.points == null || tsp.points.length == 0)
            createPoints();

        tsp.maxCycles = parseInt($("#maxCycles").val());
        tsp.alpha = parseFloat($("#alpha").val());
        tsp.gain = parseFloat($("#gain").val());
        
        $("#ptorder").val("");

        sw.start();
        tsp.runAsync();
    });
    $("#stopAsync").bind("click", function (event)
    {
        tsp.stopAsync();
    });

    $("#runSync").bind("click", function (event)
    {
        updateButtons(true);
        if(tsp.points == null || tsp.points.length == 0)
            createPoints();

        tsp.maxCycles = parseInt($("#maxCycles").val());
        tsp.alpha = parseFloat($("#alpha").val());
        tsp.gain = parseFloat($("#gain").val());
        
        $("#ptorder").val("");

        sw.start();
        tsp.runSync();
        updateButtons(false);
    });
}

function updateButtons(running)
{
    $("#done").prop("checked", !running);
    if (running == true)
    {
        $("#runAsync").attr("disabled", "disabled");
        $("#runSync").attr("disabled", "disabled");
        $("#stopAsync").removeAttr("disabled");
    } else
    {
        $("#stopAsync").attr("disabled", "disabled");
        $("#runAsync").removeAttr("disabled");
        $("#runSync").removeAttr("disabled");
    }
}

$(document).ready(function ()
{
    canvas = new Canvas(document.getElementById("canvas"));

    tsp = new TravelingSalesperson();
    tsp.finishedCallback = function(tsp)
    {
        let pto = tsp.getPointOrder();
        if(pto != null)
        {
            let str = "";
            for (let i = 0; i < pto.length; i++) {
                const pt = pto[i];
                if(pt == null)
                    str += "no solution for neuron " + i + "\n";
                else
                    str += "i: " + pt[0].toString().padStart(4, " ") + ", x: " + pt[1].x.toFixed(4) + ", y: " + pt[1].y.toFixed(4) + "\n";
            }
            $("#ptorder").val(str);
        }
    }
    tsp.progressCallback = function(tsp) 
    {
        paint_tsp(tsp); 
        $("#exectime").val(sw.getElapsedTime());
        $("#cycle").val(tsp.cycle);
        $("#length").val(Math.round(tsp.lastLength*10000) / 10000);
        updateButtons(tsp.asyncRunning);
        
    }
    setupForm(tsp);
});