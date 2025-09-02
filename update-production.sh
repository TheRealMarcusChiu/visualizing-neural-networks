#! /bin/bash

##################
# 1. REGULAR WAY #
##################

ssh -i ~/.ssh/keys/aws-marcuschiu.pem ec2-user@www.marcuschiu.com << EOF
  rm -rf visualizing-neural-networks/
  mkdir visualizing-neural-networks
EOF

scp -i ~/.ssh/keys/aws-marcuschiu.pem -r ./www ec2-user@www.marcuschiu.com:~/visualizing-neural-networks


#####################
# 2. COMPRESSED WAY #
#####################

#ssh -i ~/.ssh/keys/aws-marcuschiu.pem ec2-user@www.marcuschiu.com << EOF
#  rm -rf personal-website-two/
#  mkdir personal-website-two
#EOF
#
#tar czf public.tar.gz public
#scp -i ~/.ssh/keys/aws-marcuschiu.pem -r ./public.tar.gz ec2-user@www.marcuschiu.com:~/personal-website-two
#ssh -i ~/.ssh/keys/aws-marcuschiu.pem ec2-user@www.marcuschiu.com << EOF
#  cd personal-website-two
#  tar -xvzf public.tar.gz
#  rm public.tar.gz
#EOF
