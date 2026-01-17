$Ip = "117.252.16.130"
$User = "root"
Write-Host "Checking SchemeSathi Service Status..."
ssh "$($User)@$($Ip)" "systemctl status schemesathi --no-pager && echo '--- RECENT LOGS ---' && journalctl -u schemesathi -n 20 --no-pager"
