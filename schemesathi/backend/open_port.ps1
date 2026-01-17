$Ip = "117.252.16.130"
$User = "root"
Write-Host "Opening Port 8001 on Firewall..."
# Robust single-line command to avoid CRLF issues
$Cmd = "sudo ufw allow 8001/tcp || true; sudo firewall-cmd --zone=public --add-port=8001/tcp --permanent && sudo firewall-cmd --reload || true; sudo iptables -I INPUT -p tcp --dport 8001 -j ACCEPT || true"
ssh "$($User)@$($Ip)" $Cmd
Write-Host "Firewall update attempt finished."
