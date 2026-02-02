import json
import os
import re
from googleapiclient.discovery import build
from google.oauth2 import service_account

# 1. CONFIGURAÇÕES
ROOT_FOLDER_ID = '1NGawYimCYoI0XZbm7KAbX0oUS_sM269U'
SERVICE_ACCOUNT_FILE = 'credentials.json'
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

def get_service():
    creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)

def normalizar_para_match(nome):
    """
    Remove tudo que é ruído para que 'Index_v1_pt.pdf' e 'Index_v1_cover.jpg' 
    ambos virem apenas 'index1'.
    """
    n = nome.lower().split('.')[0]
    n = re.sub(r'(_pt|_en|_cover|_v|v|_|\s)', '', n)
    return n.strip()

def list_all_in_folder(service, folder_id):
    files = []
    page_token = None
    while True:
        query = f"'{folder_id}' in parents and trashed = false"
        results = service.files().list(q=query, fields="nextPageToken, files(id, name, mimeType, webViewLink)").execute()
        files.extend(results.get('files', []))
        page_token = results.get('nextPageToken')
        if not page_token:
            break
    return files

def executar():
    service = get_service()
    biblioteca = []
    mapa_capas = {} 

    print("🚀 Iniciando Operação de Resgate de Imagens...")

    # PASSO 1: MAPEIA A ESTRUTURA DE CAPAS
    raiz = list_all_in_folder(service, ROOT_FOLDER_ID)
    try:
        id_capas_raiz = next(f['id'] for f in raiz if 'capas' in f['name'].lower())
        obras_capas = list_all_in_folder(service, id_capas_raiz)
        
        for obra in obras_capas:
            print(f"🖼️  Indexando capas de: {obra['name']}")
            mapa_capas[obra['name']] = {}
            itens_obra = list_all_in_folder(service, obra['id'])
            for item in itens_obra:
                if item['mimeType'] == 'application/vnd.google-apps.folder':
                    imagens = list_all_in_folder(service, item['id'])
                    for img in imagens:
                        mapa_capas[obra['name']][normalizar_para_match(img['name'])] = img['id']
                else:
                    mapa_capas[obra['name']][normalizar_para_match(item['name'])] = item['id']
    except Exception as e:
        print(f"❌ Erro ao acessar a pasta de capas: {e}")
        return

    # PASSO 2: MAPEIA OS PDFS E VINCULA PELO ID REAL
    for lang in ['Português', 'English']:
        id_lang = next((f['id'] for f in raiz if lang[:4].lower() in f['name'].lower()), None)
        if not id_lang: continue

        print(f"📚 Processando PDFs em {lang}...")
        obras_pdf = list_all_in_folder(service, id_lang)
        for obra in obras_pdf:
            nome_obra = obra['name']
            itens_obra = list_all_in_folder(service, obra['id'])
            
            for item in itens_obra:
                if item['mimeType'] == 'application/vnd.google-apps.folder':
                    pdfs = list_all_in_folder(service, item['id'])
                    for pdf in pdfs:
                        if 'pdf' in pdf['name'].lower():
                            chave = normalizar_para_match(pdf['name'])
                            img_id = mapa_capas.get(nome_obra, {}).get(chave, "")
                            
                            if not img_id:
                                print(f"   ⚠️  Aviso: Capa não encontrada para {pdf['name']} (Chave: {chave})")

                            # O LINK LH3 É O ÚNICO QUE FUNCIONA 100% NO BROWSER
                            capa_url = f"https://lh3.googleusercontent.com/d/{img_id}=s1000" if img_id else ""
                            
                            biblioteca.append({
                                "id": pdf['id'],
                                "titulo": pdf['name'].replace('.pdf', ''),
                                "idioma": lang,
                                "obra": nome_obra,
                                "arco": item['name'],
                                "link": f"https://drive.google.com/file/d/{pdf['id']}/view",
                                "capa": capa_url
                            })

    # 3. SALVAR O RESULTADO
    with open('importar_ln_para_o_site.json', 'w', encoding='utf-8') as f:
        json.dump(biblioteca, f, indent=4, ensure_ascii=False)
    
    print(f"\n✅ Concluído! {len(biblioteca)} volumes prontos com links de imagem diretos.")

if __name__ == '__main__':
    executar()