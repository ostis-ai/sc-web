if ( apt-cache search python-pip | grep "python-pip\s" )
then
	sudo apt-get install -y python-pip
else
	sudo add-apt-repository universe
	sudo apt-get update
	curl https://bootstrap.pypa.io/get-pip.py --output get-pip.py
	sudo python2 get-pip.py
	sudo rm -f get-pip.py
fi
sudo pip install --default-timeout=100 future
sudo pip install tornado sqlalchemy redis==2.9 numpy configparser
