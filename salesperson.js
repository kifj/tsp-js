//https://github.com/kifj/tsp-js

/* Sample of a city */
class Point2D
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
}

/* a node in the neural network */
class TspNeuron
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
        this.next = this;
        this.prev = this;
        this.life = 3;
        this.inhibitation = 0;
        this.isWinner = 0;
        this.ringpos = 0;
    }

    /* the distance of the euklidean points */
    potential(point)
    {
        return (
            (point.x - this.x) * (point.x - this.x) +
            (point.y - this.y) * (point.y - this.y)
        );
    }

    /* moves a single node in direction to the point */
    move(point, value)
    {
        this.x += value * (point.x - this.x);
        this.y += value * (point.y - this.y);
    }

    /* computes the number of nodes between the to nodes on the ring */
    ringdistance(other, ringlength)
    {
        let s = Math.min(this.ringpos, other.ringpos);
        let l = Math.max(this.ringpos, other.ringpos);

        return Math.min(l - s, ringlength - l + s);
    }
}

/* the neural network as a ring of neurons */
class TspNeuronRing
{
    constructor(start)
    {
        this.start = start;
        this.length = 1;
    }

    /* set the position of the neurons within the ring */
    indexNodes()
    {
        let current = this.start;
        for (let i = 0; i < this.length; i++)
        {
            current.ringpos = i;
            current = current.next;
        }
    }

    /* moves all nodes to in direction of the sample */
    moveAllNodes(point, gain)
    {
        let current = this.start;
        let best = this.findMinimum(point);

        for (let i = 0; i < this.length; i++)
        {
            let dist1 = best.ringdistance(current, this.length);
            current.move(point, this.f(gain, dist1));
            current = current.next;
        }
    }

    /* finds the node with the least distance to the point */
    findMinimum(point)
    {
        let actual;
        let node = this.start;
        let best = node;
        let min = node.potential(point);
        for (let i = 1; i < this.length; i++)
        {
            node = node.next;
            actual = node.potential(point);
            if (actual < min)
            {
                min = actual;
                best = node;
            }
        }
        best.isWinner++;
        return best;
    }

    f(gain, n)
    {
        return 0.70710678 * Math.exp(-(n * n) / (gain * gain));
    }

    /* deletes a node */
    deleteNode(node)
    {
        let prev = node.prev;
        let next = node.next;

        if (prev != null)
        {
            prev.next = next;
        }
        if (next != null)
        {
            next.prev = prev;
        }
        if (next == node)
        {
            next = null;
        }
        if (this.start == node)
        {
            this.start = next;
        }
        this.length--;
    }

    /* a node is duplicated & inserted into the ring */
    duplicateNode(node)
    {
        let newNode = new TspNeuron(node.x, node.y);
        let next = node.prev;
        next.next = newNode;
        node.prev = newNode;
        node.inhibitation = 1;
        newNode.prev = next;
        newNode.next = node;
        newNode.inhibitation = 1;
        this.length++;
    }

    /* length of tour */
    tourLength()
    {
        let dist = 0.0;
        let current = this.start;
        let previous = current.prev;

        for (let i = 0; i < this.length; i++)
        {
            dist += Math.sqrt(
                (current.x - previous.x) * (current.x - previous.x) +
                (current.y - previous.y) * (current.y - previous.y)
            );
            current = previous;
            previous = previous.prev;
        }
        return dist;
    }
}

/* the simulator containing all the data */
class TravelingSalesperson
{
    constructor()
    {
        this.cycle = 0; /* Number of complete survey done */
        this.maxCycles = 1000; /* Number of complete surveys */
        this.points = null; /* the points */
        this.neurons = null; /* the neurons */
        this.alpha = 0.05; /* learning rate */
        this.gain = 50.0; /* gain */
        this.lastLength = null; /* length of tour */
        this.asyncRunning = false;
        this.asyncTriggerInterval = 10; /* interval in ms for the async process trigger */
        this.update = 5; /* screen update (every n cycles) */
        this.finishedCallback = null;
        this.progressCallback = null;
    }

    /* creates the first node (ring) */
    createFirstNeuron()
    {
        let start = new TspNeuron(0.5, 0.5);
        this.neurons = new TspNeuronRing(start);
    }

    /* deletes all nodes */
    deleteAllNeurons()
    {
        if (this.neurons != null)
        {
            while (this.neurons.start != null)
            {
                this.neurons.deleteNode(this.neurons.start);
            }
            this.neurons = null;
        }
    }

    /* prints positions of points & nodes */
    print()
    {
        console.log("TSP: N=%o, cycle=%o, lastLength=%o", this.points.length, this.cycle, this.lastLength);
        for (let i = 0; i < this.points.length; i++)
        {
            let c = this.points[i];
            console.log("Point: %o (%o,%o)", i, c.x, x.y);
        }
        let n = this.neurons.start;
        for (i = 0; i < this.neurons.length; i++)
        {
            console.log("Neuron: %o(%o,%o)", i, n.x, n.y);
            n = n.next;
        }
    }

    setPoints(points)
    {
        this.points = points;
    }

    progress()
    {
        if(typeof(this.progressCallback) == "function")
        {
            this.progressCallback(this);
        }
    }

    finished()
    {
        if (typeof (this.finishedCallback) === "function")
        {
            this.finishedCallback(this);
        }
    }

    stopAsync()
    {
        this.asyncRunning = false;
        this.progress();
        this.deleteAllNeurons();
    }

    runAsync()
    {
        this.stopAsync();
        this._init();
        this.asyncRunning = true;
        this._runAsync();
    }

    _init()
    {
        if(this.points == null || this.points.length == 0)
        {
            throw "No points available";
        }
        this.cycle = 0;
        this.lastLength = null;
        this.neurons = []
        this.currentgain = this.gain;
        this.createFirstNeuron();
        this.progress();
    }

    _runAsync()
    {
        if (this.neurons != null)
        {
            if (this.cycle < this.maxCycles && this.asyncRunning)
            {
                let done = this.surveyRun();
                if (!done)
                {
                    let self = this;
                    window.setInterval(function ()
                    {
                        self._runAsync();
                    }, this.asyncTriggerInterval);
                    return;
                }
            }
            if (this.asyncRunning)
            {
                //run has finished
                //this.print();
                this.asyncRunning = false;
                this.progress();
                this.finished(this);
            }
        }
    }

    runSync()
    {
        if(this.asyncRunning == true)
        {
            return false;
        }
        this.deleteAllNeurons();
        this._init();
        
        while(this.cycle < this.maxCycles)
        {
            if (this.surveyRun())
            {
                this.progress();
                this.finished();
                return true;
            }
        }
        return false;
    }

    /* one cycle in the simulation */
    surveyRun()
    {
        let done = false;
        if (this.neurons != null)
        {
            this.neurons.indexNodes();
            for (let i = 0; i < this.points.length; i++)
            {
                this.neurons.moveAllNodes(this.points[i], this.currentgain);
            }
        }
        this.surveyFinish();
        this.currentgain = this.currentgain * (1 - this.alpha);
        if (this.cycle++ % this.update == 0)
        {
            let length = this.neurons.tourLength();
            //this.print();
            this.progress();
            if (length == this.lastLength)
            {
                done = true;
            }
            else
            {
                this.lastLength = length;
            }
        }
        return done;
    }

    /* after moving creating & deleting is done */
    surveyFinish()
    {
        if (this.neurons == null)
        {
            return;
        }
        let node = this.neurons.start;
        for (let i = 0; i < this.neurons.length; i++)
        {
            node.inhibitation = 0;
            switch (node.isWinner)
            {
                case 0:
                    node.life--;
                    if (node.life == 0)
                    {
                        this.neurons.deleteNode(node);
                    }
                    break;
                case 1:
                    node.life = 3;
                    break;
                default:
                    node.life = 3;
                    this.neurons.duplicateNode(node);
                    break;
            }
            node.isWinner = 0;
            node = node.next;
        }
    }

    _findPoint(p, epsilon)
    {
        let eps = epsilon || Number.EPSILON * Number.EPSILON;
        for(let i = 0; i < this.points.length; i++)
        {
            let point = this.points[i];
            let a = point.x - p.x;
            let b = point.y - p.y;
            let dist =  (a * a) + (b * b);
            if(dist <= eps)
            {
                return [i, point];
            }
        }
        return null;
    }

    getPointOrder()
    {
        if(this.neurons.length != this.points.length)
        {
            //no solution
            return null;
        }
        let result = [];
        let node = this.neurons.start;
        for (let i = 0; i < this.neurons.length; i++)
        {
            result.push(this._findPoint(node));
            node = node.next;
        }
        return result;
    }
}