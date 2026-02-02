import re
import time
from googleapiclient.discovery import build
from google.oauth2 import service_account

# CONFIGURAÇÕES
SERVICE_ACCOUNT_FILE = 'credentials.json'
SCOPES = ['https://www.googleapis.com/auth/drive']

# IDs APENAS DAS PASTAS DE TEXTO (NT/GT English e Português)
PASTAS_PARA_ORGANIZAR = [
    '1hM192O0KbBO6VlYyNfZSXMx_clehVTtd', # NT English
    '1CvavnR55wWVNBIOeNsOPgV4JunCaeWRP', # GT English
    '1akBbqBF_DNUKX_ICaTcNMdxbQtOi9c71', # NT Português
    '1mmg4fjh15cnooYNCqD0699bs6voZtopj'  # GT Português
]

MAPA_ARCOS = {
    "NT": {
        "1": "Freshmen Arc", "2": "Homecoming Arc", "3": "Hawaii Invasion Arc",
        "4": "Baggage City Arc", "5": "Ichihanaran Festival Arc", "6": "Ichihanaran Festival Arc",
        "7": "Agitate Halation Arc", "8": "Magic God Othinus Arc", "9": "Magic God Othinus Arc",
        "10": "Magic God Othinus Arc", "11": "Mental Out Arc", "12": "St. Germain Arc",
        "13": "Magic God Invasion Arc", "14": "World Rejecter Arc", "15": "Salome Arc",
        "16": "Element Arc", "17": "Kamisato Rescue Arc", "18": "Aleister Crowley Arc",
        "19": "Processor Suit Arc", "20": "Coronzon Arc", "21": "Coronzon Arc",
        "22": "Coronzon Arc", "22r": "Kamijou Arc"
    },
    "GT": {
        "1": "Christmas Eve Arc", "2": "Christmas Day Arc", "3": "Operation Handcuffs Arc",
        "4": "Los Angeles Arc", "5": "Post-Handcuffs Arc", "6": "New Year's Eve Arc",
        "7": "New Year's Arc", "8": "New Year's Arc", "9": "New Year's Arc", "10": "New Year's Arc"
    }
}

def get_service():
    creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)

def organizar():
    service = get_service()
    for folder_id in PASTAS_PARA_ORGANIZAR:
        print(f"📂 Organizando PDFs na zona: {folder_id}")
        query = f"'{folder_id}' in parents and trashed = false"
        files = service.files().list(q=query, fields="files(id, name, mimeType)").execute().get('files', [])
        
        pastas_cache = {}

        for f in files:
            if f['mimeType'] == 'application/vnd.google-apps.folder': continue
            
            # Regex para capturar NT_v ou GT_v
            match = re.search(r'(NT|GT)_v(\d+r?)', f['name'])
            if match:
                serie, vol = match.groups()
                nome_arco = MAPA_ARCOS.get(serie, {}).get(vol)

                if nome_arco:
                    # ESCAPE DE ASPAS: Essencial para o "New Year's Arc"
                    nome_query = nome_arco.replace("'", "\\'")
                    
                    if nome_arco not in pastas_cache:
                        # Verifica se a pasta do arco já existe
                        q_exist = f"name = '{nome_query}' and '{folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder'"
                        exist = service.files().list(q=q_exist).execute().get('files', [])
                        
                        if exist:
                            pastas_cache[nome_arco] = exist[0]['id']
                        else:
                            # Cria a pasta se não existir
                            meta = {'name': nome_arco, 'mimeType': 'application/vnd.google-apps.folder', 'parents': [folder_id]}
                            pastas_cache[nome_arco] = service.files().create(body=meta, fields='id').execute()['id']
                    
                    # Move o PDF para a pasta do Arco
                    target = pastas_cache[nome_arco]
                    service.files().update(fileId=f['id'], addParents=target, removeParents=folder_id).execute()
                    print(f"  🚚 {f['name']} -> {nome_arco}")
                    time.sleep(0.1) 

if __name__ == '__main__':
    organizar()