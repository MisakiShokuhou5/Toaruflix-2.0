import os
import subprocess
import sys

def run_git(command):
    """Executa comando Git e retorna o resultado."""
    return subprocess.run(command, shell=True, capture_output=True, text=True)

def protocolo_de_envio(target_fmt, commit_msg):
    """Fluxo definitivo para garantir que o código chegue ao GitHub."""
    
    print("\n📦 [1/3] Preparando arquivos...")
    run_git(f"git add {target_fmt}")
    run_git(f'git commit -m "{commit_msg}"')

    print("🔄 [2/3] Sincronizando com o servidor (Pull)...")
    pull = run_git("git pull origin main --rebase")
    
    if pull.returncode != 0:
        print("\n⚠️ Conflito detectado! O Git não conseguiu unir as versões automaticamente.")
        print("Ação: Abra o VS Code, resolva os arquivos em vermelho e tente novamente.")
        return False

    print("⬆️ [3/3] Enviando para o GitHub (Push)...")
    push = run_git("git push origin main")
    
    if push.returncode == 0:
        print("\n✨ " + "="*30)
        print("   MISSÃO CUMPRIDA: SITE ATUALIZADO!")
        print("   " + "="*30)
        return True
    else:
        print(f"\n❌ Erro no envio final:\n{push.stderr}")
        return False

def escolher_alvo(base_path, apenas_pastas=False):
    caminho = base_path
    meu_nome = os.path.basename(__file__)
    while True:
        print(f"\n📍 Local atual: {caminho}")
        items = [f for f in os.listdir(caminho) if not f.startswith('.') 
                 and f not in [meu_nome, 'enviar.bat', 'node_modules', 'dist']]
        if apenas_pastas:
            items = [f for f in items if os.path.isdir(os.path.join(caminho, f))]
        
        print("0. [ SELECIONAR ESTE LOCAL ]")
        for i, item in enumerate(items):
            tipo = "[DIR]" if os.path.isdir(os.path.join(caminho, item)) else "[ARQ]"
            print(f"{i + 1}. {tipo} {item}")

        escolha = input("\nEscolha (ou 'q' para cancelar): ").strip()
        if escolha.lower() == 'q': return None
        if escolha == '0': return caminho
        try:
            idx = int(escolha) - 1
            novo_path = os.path.join(caminho, items[idx])
            if os.path.isdir(novo_path): caminho = novo_path
            else: return novo_path
        except: print("❌ Opção inválida.")

def main():
    print("\n" + "⚡"*20)
    print("  TREE DIAGRAM")
    print("  " + "⚡"*20)
    
    print("\n1. Enviar Tudo (Geral)\n2. Escolher Arquivo/Pasta\n3. Sincronizar (Apenas Pull)")
    op = input("\nEscolha: ").strip()

    if op == "1":
        protocolo_de_envio(".", ".")
    elif op == "2":
        target = escolher_alvo(".")
        if target:
            msg = input(f"\nMensagem para {os.path.basename(target)} [.]: ") or "."
            protocolo_de_envio(f'"{target}"', msg)
    elif op == "3":
        print("🔄 Sincronizando...")
        run_git("git pull origin main --rebase")
        print("✅ Sincronizado.")

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: sys.exit(0)