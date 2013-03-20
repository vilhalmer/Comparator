comparator
==========

Comparator is a simple web server which communicates with your Minecraft server and generates status pages.

There will be more documentation here, for now, just know that to run this, edit the stuff in comparator.conf, making sure to provide a user and group to run as. Run `sudo node comparator.js` (sudo is needed to grab port 80), and it will drop down to the provided user to ensure that it's relatively secure. I haven't tested anything security-wise, so run at your own risk. Anything in this directory is accessible from the internet while it's running. Good luck!
