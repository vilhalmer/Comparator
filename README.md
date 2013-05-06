# Comparator #
Comparator is a simple web server written in node.js, which communicates with your Minecraft server and generates status pages.

## What does it do? ##
Comparator uses the query feature of the Minecraft server to retrieve information such as the version, current/maximum players, usernames of currently logged in players, and the message of the day.  
In the future, I'd like to also implement RCON support on some level, to allow the status page to display console messages, such as most recent death. (Because it'd be funny. :D)

## How do I use it? ##
Comparator is implemented as a web server. To get started:

1. Edit comparator.conf. The fields are fairly self-explanatory, the ones beginning with 'target' are where the Minecraft server lives, and the others are for the Comparator server. Make sure to provide a valid user and group for the Comparator server to run itself as.  
2. Modify the HTML/CSS templates however you see fit. Comparator uses them to generate the page that it sends to the client by replacing each %%variable%% with the corresponding data it retrieved from the server. 'status.html' is used if the server was reachable, 'offline.html' if not. A full list of keys can be found here: http://wiki.vg/Query#K.2C_V_section  
3. Run `sudo node comparator.js` and enjoy!

## FAQ ##
Q. How do I get this to play nicely with the rest of my website?  
A. If you're using Apache, you can add a VirtualHost directive like this:

    <VirtualHost *:80>
        ServerName cleverexamplesite.com
                
        ProxyRequests off
                      
        <Proxy *>
            Order deny,allow
            Allow from all
        </Proxy>                                      
        
        <Location /status>
            ProxyPass http://localhost:3000/
            ProxyPassReverse http://localhost:3000/
        </Location>
    </VirtualHost>

…where cleverexamplesite.com is your site, and <Location /status> is the path that you want the status page to exist at. You'll also need to add `NameVirtualHost *:80` somewhere above that to enable it. In comparator.conf, you should configure it with a host of "localhost", port of 3000 (or whatever you want to change it to, just not 80), and path of whatever you chose for the <Location> bit.

Q. Nobody has actually asked any of these, have they?  
A. Nope, not at all.

Q. Sweet.  
A. Yep.
