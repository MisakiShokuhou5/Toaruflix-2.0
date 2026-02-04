import os
import subprocess
import sys

def run_git(command):
    """Executa o comando e captura o resultado para análise."""
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result

def resolver_problema(resultado, comando_tentado):
    """Analisa o erro do Git e pergunta o que fazer."""
    erro = resultado.stderr.lower()
    
    print("\n--- ⚠️ O PROCESSO PAROU: PROBLEMA DETECTADO ---")
    
    # CASO 1: Push Rejeitado (GitHub está na frente)
    if "rejected" in erro or "fetch first" in erro:
        print("Motivo: O GitHub tem arquivos que você não tem no PC.")
        print("Ação: Preciso sincronizar (Pull) antes de enviar.")
        opt = input("\nSincronizar e tentar enviar agora? (1) Sim (2) Não: ")
        if opt == "1":
            print("🔄 Sincronizando...")
            run_git("git pull origin main --rebase")
            print("⬆️ Tentando enviar novamente...")
            final = run_git("git push origin main")
            if final.returncode == 0: print("✨ Sucesso!")
            return True

    # CASO 2: Alterações soltas impedem o Pull
    elif "unstaged changes" in erro or "locally modified" in erro:
        print("Motivo: Você tem arquivos modificados que ainda não foram 'salvos' (comitados).")
        print("O Git não deixa sincronizar com a casa bagunçada.")
        print("\nO que deseja fazer?")
        print("1. Salvar tudo agora (git add + commit) e continuar")
        print("2. Esconder as mudanças temporariamente (Stash)")
        opt = input("Escolha: ")
        if opt == "1":
            msg = input("Mensagem para salvar: ") or "."
            run_git("git add .")
            run_git(f'git commit -m "{msg}"')
            return True # Retorna True para você tentar o comando original de novo

    # CASO 3: Conflito de verdade (Dois arquivos editados no mesmo lugar)
    elif "conflict" in erro:
        print("Motivo: CONFLITO REAL! Você e o GitHub mexeram na mesma linha.")
        print("Ação: Você precisará abrir o VS Code e resolver manualmente.")
        input("Pressione Enter para fechar e resolver os arquivos em vermelho...")
        sys.exit(0)

    else:
        print(f"Erro desconhecido:\n{resultado.stderr}")
        input("\nPressione Enter para sair...")
    
    return False

def deploy():
    print("\n" + "="*45)
    print("🌳 TREE DIAGRAM - SISTEMA INTELIGENTE v4.0")
    print("="*45)
    
    print("\n1. Enviar Tudo\n2. Ficheiro Específico\n3. Pasta Específica\n4. Sincronizar Tudo")
    opcao = input("\nEscolha: ").strip()
    
    # ... (Lógica de navegação de pastas que já tínhamos) ...
    # Para encurtar, vamos focar na lógica de erro:
    
    target = "." # Simplificando para o exemplo, mas mantenha sua navegação
    if opcao == "2": target = "." # Aqui entraria sua função de navegar

    # FLUXO DE EXECUÇÃO COM MONITORAMENTO
    print(f"\n🛰️ Iniciando protocolo de envio...")
    
    # 1. Tenta Add
    run_git(f"git add {target}")
    
    # 2. Tenta Commit
    res_commit = run_git(f'git commit -m "."')
    # Se o commit der erro de 'nothing to commit', a gente ignora e segue
    
    # 3. Tenta Push
    print("⬆️ Enviando...")
    res_push = run_git("git push origin main")
    
    if res_push.returncode != 0:
        # SE DEU ERRO, CHAMA A IA RESOLVEDORA
        if resolver_problema(res_push, "push"):
            print("✅ Problema resolvido pelo sistema.")
        else:
            print("❌ Não foi possível resolver automaticamente.")
    else:
        print("\n Missão Cumprida!")

if __name__ == "__main__":
    try:
        deploy()
    except KeyboardInterrupt:
        sys.exit(0)