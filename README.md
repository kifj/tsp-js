# Travelling Salesman Problem in JavaScript Canvas

Got an email from chris from hobbyelektronik.org who did a complete rework of the code with various improvements.
I'd happily like to share this: [https://hobbyelektronik.org/demos/tsp-js/](https://hobbyelektronik.org/demos/tsp-js/)

The following things have been optimized:

* Code separated for presentation & computation
* Converted to ECMAScript 2015 classes
* Callbacks for progress and finished
* Measurement of runtime
* Output of point order
* Performance improvement by better calculation of point distance in ring
* Synchronous operation