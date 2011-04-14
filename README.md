postman-client: The Postman Google Chrome extension
===================================================

Postman is a Google Chrome extension to make sharing links with your friends
instant and effortless.

Go install it [from the Chrome Web Store](https://chrome.google.com/webstore/detail/ceebmhkhkjlbcehplmobnnhbibghnenj)

**This is the client part.** Find the source to the server [here](https://github.com/obeattie/postman-server).

Gettin' all techie
------------------

Like I said earlier, this part is a Google Chrome extension. Therefore, it's
built using lovely HTML and JavaScript.

Aside from that, WebSockets are used to communicate with the [server](https://github.com/obeattie/postman-server)
by way of the amazing [Socket.IO](http://socket.io/) — therefore, when you send
something to your friends, you can be sure that they'll get it instantly
(providing they're using Postman of course).

There are a few other libraries we use too, such as [Underscore.js](http://documentcloud.github.com/underscore/),
[jQuery](http://www.jquery.com/), and [jsuri](http://code.google.com/p/jsuri/)

The people behind the curtain
-----------------------------

As we're sure you can see from the commits, this is a little "few-weekends
project" gift to the world from two guys who found it too difficult to share
links with one another:

*   Oliver Beattie<br />
    [http://www.obeattie.com/](http://www.obeattie.com/)<br />
    [GitHub: obeattie](https://github.com/obeattie)<br />
    [@obeattie](http://twitter.com/obeattie)
*   Adam Collingburn<br />
    [GitHub: adamcollingburn](https://github.com/adamcollingburn)<br />
    [@adamcollingburn](http://twitter.com/adamcollingburn)

…and from our company, [Emberbox](http://www.emberb0x.com/), where we're busily
working away building truly awesome products.

License
-------
(The MIT license)

Copyright (C) 2011 by Emberbox Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
