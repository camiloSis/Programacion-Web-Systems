import nmap

scanner = nmap.PortScanner()

ip = input("Inserte una dirección IP: ")
print("Esta es la IP que ingresaste:", ip)

scanner.scan(ip)

print(scanner.all_hosts())