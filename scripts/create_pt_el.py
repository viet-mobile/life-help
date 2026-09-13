# scripts/create_pt_el.py
import json
import os

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'messages')

with open(os.path.join(MESSAGES_DIR, 'en.json'), 'r', encoding='utf-8') as f:
    en = json.load(f)

# Portuguese (pt - Brazilian)
pt = {}
# Greek (el)
el = {}

# Customer
pt['customer'] = {
  "tagline": "Serviços convenientes para o seu dia a dia no seu idioma",
  "emergency": "Solicite ajuda de emergência agora",
  "servicesTitle": "De qual serviço você precisa?",
  "consultation": "Atendimento multilíngue",
  "verified": "Conexão com profissionais verificados de ajuda doméstica",
  "payment": "Pagamento seguro",
  "review": "Avaliações após o serviço",
  "helperMasterBanner": "Especialistas locais com excelentes habilidades e experiência, cadastrem-se aqui",
  "helperRegisterBtn": "Cadastrar-se como Especialista Pro →",
  "paymentLink": "Guia de Transferência Bancária →",
  "reviewLink": "Deixar uma Avaliação →"
}

el['customer'] = {
  "tagline": "Βολικές οικιακές υπηρεσίες στη γλώσσα σας",
  "emergency": "Ζητήστε επείγουσα βοήθεια τώρα",
  "servicesTitle": "Ποια υπηρεσία χρειάζεστε;",
  "consultation": "Πολύγλωσση εξυπηρέτηση",
  "verified": "Σύνδεση με πιστοποιημένους τεχνικούς οικιακής βοήθειας",
  "payment": "Ασφαλής πληρωμή",
  "review": "Αξιολογήσεις μετά την εργασία",
  "helperMasterBanner": "Έμπειροι τοπικοί τεχνικοί με εξαιρετικές δεξιότητες, εγγραφείτε εδώ",
  "helperRegisterBtn": "Εγγραφή ως Επαγγελματίας Τεχνικός →",
  "paymentLink": "Οδηγός Τραπεζικής Μεταφοράς →",
  "reviewLink": "Αφήστε μια Αξιολόγηση →"
}

# Service
pt['service'] = {
  "toilet": "Vaso Sanitário Entupido",
  "sink": "Pia Entupida",
  "drain": "Ralo Entupido",
  "leak": "Vazamento de Água",
  "detection": "Detecção de Vazamento",
  "water": "Abastecimento de Água",
  "plumbing": "Encanamento",
  "boiler": "Aquecedor e Caldeira",
  "cleaning": "Limpeza",
  "housing": "Moradia e Quartos"
}

el['service'] = {
  "toilet": "Απόφραξη Λεκάνης",
  "sink": "Απόφραξη Νεροχύτη",
  "drain": "Απόφραξη Σιφωνιού",
  "leak": "Διαρροή Νερού",
  "detection": "Ανίχνευση Διαρροής",
  "water": "Παροχή Νερού",
  "plumbing": "Υδραυλικά",
  "boiler": "Λέβητας & Θέρμανση",
  "cleaning": "Καθαρισμός",
  "housing": "Στέγαση & Δωμάτια"
}

# Common
pt['common'] = {
  "comingSoon": "Em breve",
  "back": "Voltar",
  "detail": "Detalhes",
  "apply": "Solicitar",
  "bilingualMode": "Bilíngue (Coreano)",
  "monolingualMode": "Um só idioma",
  "bilingualToggleHint": "Modo bilíngue (Clique para modo de um idioma)",
  "monolingualToggleHint": "Modo de um idioma (Clique para modo bilíngue)",
  "nativeConsultation": "Atendimento no Idioma Nativo",
  "nativeConsultationCenter": "Central de Atendimento em Tempo Real no Idioma Nativo"
}

el['common'] = {
  "comingSoon": "Σύντομα κοντά σας",
  "back": "Πίσω",
  "detail": "Λεπτομέρειες",
  "apply": "Αίτηση",
  "bilingualMode": "Δίγλωσσο (Κορεατικά)",
  "monolingualMode": "Μία γλώσσα",
  "bilingualToggleHint": "Δίγλωσση λειτουργία (Κλικ για μία γλώσσα)",
  "monolingualToggleHint": "Λειτουργία μίας γλώσσας (Κλικ για δίγλωσση)",
  "nativeConsultation": "Εξυπηρέτηση στη Μητρική Γλώσσα",
  "nativeConsultationCenter": "Κέντρο Εξυπηρέτησης στη Μητρική Γλώσσα σε Πραγματικό Χρόνο"
}

# Privacy
pt['privacy'] = {
  "title": "Aviso de Privacidade",
  "content": "Para proteger sua privacidade, não armazenamos seu nome, endereço ou número de telefone. Seu número de telefone é convertido em um número virtual 050 temporário e encaminhado ao técnico. O número temporário é mantido por uma semana para sua conveniência e depois destruído permanentemente. Seu histórico de serviço é armazenado apenas no seu dispositivo e não será transferido se você trocar de aparelho."
}

el['privacy'] = {
  "title": "Προστασία Προσωπικών Δεδομένων",
  "content": "Για την προστασία του απορρήτου σας, δεν αποθηκεύουμε το όνομα, τη διεύθυνση ή τον αριθμό τηλεφώνου σας. Ο αριθμός τηλεφώνου σας μετατρέπεται σε προσωρινό εικονικό αριθμό 050 και διαβιβάζεται στον τεχνικό. Ο προσωρινός αριθμός διατηρείται για μία εβδομάδα για δική σας διευκόλυνση και στη συνέχεια καταστρέφεται οριστικά. Το ιστορικό χρήσης των υπηρεσιών αποθηκεύεται μόνο στη συσκευή σας και δεν μεταφέρεται εάν αλλάξετε συσκευή."
}

# Request
pt['request'] = {
  "title": "Solicitação de Serviço",
  "selectedService": "Serviço Selecionado",
  "problemLabel": "Qual problema você está enfrentando?",
  "problemPlaceholder": "Ex.: A água do vaso não desce e continua subindo.",
  "photosLabel": "Anexe fotos se disponíveis.",
  "chooseFile": "Escolher Arquivo",
  "noFileChosen": "Nenhum arquivo escolhido",
  "photosHint": "Fotos ajudam os técnicos a entender e se preparar melhor para o serviço.",
  "addressLabel": "Endereço",
  "addressPlaceholder": "Por favor, insira seu endereço.",
  "phoneLabel": "Número de Telefone",
  "phonePlaceholder": "010-0000-0000",
  "submitButton": "Enviar Solicitação",
  "successTitle": "Sua solicitação de serviço foi recebida.",
  "successNotice": "Atualmente em fase de testes piloto.",
  "backHome": "Voltar ao Início",
  "notFound": "Serviço não encontrado.",
  "housingLabel": "Que tipo de moradia você está procurando?",
  "housingPlaceholder": "Ex.: Procuro kitnet/1 quarto mobiliado, depósito de 3-5M KRW, aluguel de 350-450K KRW/mês.",
  "housingRegionLabel": "Selecione a região para onde deseja se mudar",
  "housingRegionPlaceholder": "Digite o bairro / local de preferência (ex.: Yeongdeung-dong, Shin-dong...)",
  "targetSearchRegion": "Região de Busca",
  "changeRegion": "Alterar Região ▾",
  "selectTownIn": "Selecione o bairro diretamente:",
  "fillWithMyLocation": "Preencher com minha localização atual",
  "testStageNotice": "Atualmente em fase de envio para testes.",
  "photoHintText": "Fotos nos ajudam a avaliar o problema com precisão."
}

el['request'] = {
  "title": "Αίτηση Παροχής Υπηρεσίας",
  "selectedService": "Επιλεγμένη Υπηρεσία",
  "problemLabel": "Ποιο πρόβλημα αντιμετωπίζετε;",
  "problemPlaceholder": "π.χ. Το νερό στη λεκάνη δεν φεύγει και συνεχίζει να ανεβαίνει.",
  "photosLabel": "Επισυνάψτε φωτογραφίες εάν υπάρχουν.",
  "chooseFile": "Επιλογή αρχείου",
  "noFileChosen": "Δεν επιλέχθηκε αρχείο",
  "photosHint": "Οι φωτογραφίες βοηθούν τους τεχνικούς να κατανοήσουν και να προετοιμαστούν καλύτερα.",
  "addressLabel": "Διεύθυνση",
  "addressPlaceholder": "Παρακαλώ εισαγάγετε τη διεύθυνσή σας.",
  "phoneLabel": "Αριθμός Τηλεφώνου",
  "phonePlaceholder": "010-0000-0000",
  "submitButton": "Υποβολή Αίτησης",
  "successTitle": "Η αίτηση παροχής υπηρεσίας ελήφθη επιτυχώς.",
  "successNotice": "Αυτή τη στιγμή βρισκόμαστε σε πιλοτικό στάδιο δοκιμών.",
  "backHome": "Επιστροφή στην Αρχική",
  "notFound": "Η υπηρεσία δεν βρέθηκε.",
  "housingLabel": "Τι είδους κατοικία αναζητάτε;",
  "housingPlaceholder": "π.χ. Αναζητώ επιπλωμένη γκαρσονιέρα/δυάρι, εγγύηση 3-5 εκατ. KRW, ενοίκιο 350-450 χιλ. KRW/μήνα.",
  "housingRegionLabel": "Επιλέξτε την περιοχή στην οποία θέλετε να μετακομίσετε",
  "housingRegionPlaceholder": "Εισαγάγετε προτιμώμενη γειτονιά / τοποθεσία (π.χ. Yeongdeung-dong, Shin-dong...)",
  "targetSearchRegion": "Περιοχή Αναζήτησης",
  "changeRegion": "Αλλαγή Περιοχής ▾",
  "selectTownIn": "Επιλέξτε περιοχή απευθείας:",
  "fillWithMyLocation": "Συμπλήρωση με την τρέχουσα τοποθεσία μου",
  "testStageNotice": "Επί του παρόντος βρίσκεται σε δοκιμαστικό στάδιο υποβολής.",
  "photoHintText": "Οι φωτογραφίες μάς βοηθούν να εκτιμήσουμε το πρόβλημα."
}

# Service Detail
pt['serviceDetail'] = {
  "notFound": "Serviço não encontrado.",
  "backHome": "Voltar ao Início",
  "needService": "Se você precisa deste serviço, envie uma solicitação.",
  "applyTitle": "Deseja solicitar este serviço?",
  "applyDesc": "Descreva o problema e anexe fotos para conectarmos você a um especialista qualificado próximo.",
  "applyButton": "Solicitar Serviço",
  "targetHousingArea": "Área de Busca de Moradia",
  "changeRegion": "Alterar Região"
}

el['serviceDetail'] = {
  "notFound": "Η υπηρεσία δεν βρέθηκε.",
  "backHome": "Επιστροφή στην Αρχική",
  "needService": "Εάν χρειάζεστε αυτήν την υπηρεσία, υποβάλετε μια αίτηση.",
  "applyTitle": "Θέλετε να ζητήσετε αυτήν την υπηρεσία;",
  "applyDesc": "Περιγράψτε το πρόβλημα και επισυνάψτε φωτογραφίες για να σας συνδέσουμε με έναν κοντινό εξειδικευμένο τεχνικό.",
  "applyButton": "Αίτηση Υπηρεσίας",
  "targetHousingArea": "Περιοχή Αναζήτησης Κατοικίας",
  "changeRegion": "Αλλαγή Περιοχής"
}

# Service Problems
pt['serviceProblems'] = {
  "toilet": "A água do vaso sanitário não desce e continua subindo.",
  "sink": "O ralo da pia da cozinha está entupido e com mau cheiro.",
  "drain": "O ralo do banheiro está entupido e a água não escoa.",
  "leak": "A água está pingando do teto ou da parede, molhando o papel de parede.",
  "detection": "A conta de água está anormalmente alta e o vizinho reclama de vazamentos.",
  "water": "A torneira não fecha completamente, vaza água ou sai água enferrujada.",
  "plumbing": "O cano sob a pia está quebrado e a água está vazando no chão.",
  "boiler": "O aquecedor pisca um código de erro; não há água quente nem aquecimento.",
  "cleaning": "Preciso de limpeza pós-mudança ou limpeza profunda de banheiro/cozinha.",
  "housing": "Procuro kitnet/1 quarto mobiliado, depósito de 3-5M KRW, aluguel de 350-450K KRW/mês."
}

el['serviceProblems'] = {
  "toilet": "Το νερό στη λεκάνη δεν φεύγει και συνεχίζει να ανεβαίνει.",
  "sink": "Ο νεροχύτης της κουζίνας έχει βουλώσει και μυρίζει άσχημα.",
  "drain": "Το σιφώνι του μπάνιου έχει φράξει και το νερό δεν αποστραγγίζεται.",
  "leak": "Στάζει νερό από το ταβάνι ή τον τοίχο, βρέχοντας την ταπετσαρία.",
  "detection": "Ο λογαριασμός νερού είναι ασυνήθιστα υψηλός και ο γείτονας διαμαρτύρεται για διαρροές.",
  "water": "Η βρύση δεν κλείνει εντελώς, στάζει ή βγάζει σκουριασμένο νερό.",
  "plumbing": "Ο σωλήνας κάτω από τον νεροχύτη έχει σπάσει και τρέχει νερό στο πάτωμα.",
  "boiler": "Ο λέβητας αναβοσβήνει κωδικό σφάλματος. Δεν υπάρχει ζεστό νερό ούτε θέρμανση.",
  "cleaning": "Χρειάζομαι καθαρισμό μετακόμισης ή βαθύ καθαρισμό μπάνιου/κουζίνας.",
  "housing": "Αναζητώ επιπλωμένη γκαρσονιέρα/δυάρι, εγγύηση 3-5 εκατ. KRW, ενοίκιο 350-450 χιλ. KRW/μήνα."
}

# Payment
pt['payment'] = {
  "title": "Guia de Pagamento e Transferência Bancária",
  "subtitle": "Confira os dados bancários abaixo para um atendimento seguro e imediato.",
  "bankTransferInstruction": "Por favor, transfira para o Woori Bank 1002-080-001919",
  "bankNameLabel": "Banco",
  "bankName": "Woori Bank (우리은행)",
  "accountNumberLabel": "Número da Conta",
  "accountNumber": "1002-080-001919",
  "accountHolderLabel": "Titular da Conta",
  "accountHolder": "LIFE.HELP (라이프헬퍼)",
  "copyAccountBtn": "Copiar Número da Conta",
  "copySuccessToast": "Número da conta copiado para a área de transferência.",
  "noticeTitle": "Instruções de Pagamento",
  "notice1": "Insira seu nome ou os últimos 4 dígitos do seu telefone como remetente para verificação rápida.",
  "notice2": "Após a confirmação do pagamento, um especialista dedicado é atribuído e a confirmação é enviada imediatamente.",
  "notice3": "Se precisar de recibo ou confirmação de pagamento, entre em contato pelo suporte ao vivo.",
  "liveChatBtn": "Chat de Atendimento ao Vivo",
  "homeBtn": "Voltar ao Início",
  "copiedToast": "Copiado",
  "supportCenter": "Central de Atendimento ao Cliente"
}

el['payment'] = {
  "title": "Οδηγός Πληρωμής & Τραπεζικής Μεταφοράς",
  "subtitle": "Δείτε παρακάτω τα στοιχεία τραπεζικής μεταφοράς για ασφαλή και άμεση παροχή υπηρεσιών.",
  "bankTransferInstruction": "Παρακαλώ μεταφέρετε στην τράπεζα Woori Bank 1002-080-001919",
  "bankNameLabel": "Τράπεζα",
  "bankName": "Woori Bank (우리은행)",
  "accountNumberLabel": "Αριθμός Λογαριασμού",
  "accountNumber": "1002-080-001919",
  "accountHolderLabel": "Δικαιούχος",
  "accountHolder": "LIFE.HELP (라이프헬퍼)",
  "copyAccountBtn": "Αντιγραφή Αριθμού Λογαριασμού",
  "copySuccessToast": "Ο αριθμός λογαριασμού αντιγράφηκε στο πρόχειρο.",
  "noticeTitle": "Οδηγίες Πληρωμής",
  "notice1": "Εισαγάγετε το όνομά σας ή τα τελευταία 4 ψηφία του τηλεφώνου σας ως όνομα αποστολέα για ταχύτερη επιβεβαίωση.",
  "notice2": "Μόλις επιβεβαιωθεί η πληρωμή, ανατίθεται εξειδικευμένος τεχνικός και αποστέλλεται άμεσα η επιβεβαίωση.",
  "notice3": "Εάν χρειάζεστε απόδειξη ή επιβεβαίωση πληρωμής, επικοινωνήστε με την υποστήριξη πελατών.",
  "liveChatBtn": "Ζωντανή Συνομιλία Υποστήριξης",
  "homeBtn": "Επιστροφή στην Αρχική",
  "copiedToast": "Αντιγράφηκε",
  "supportCenter": "Κέντρο Υποστήριξης Πελατών"
}

# Review
pt['review'] = {
  "title": "Avaliação do Cliente",
  "subtitle": "Deixe seu feedback sincero sem precisar inserir informações pessoais. Sua avaliação será enviada diretamente à gerência em contact@life.help.",
  "anonymousBadge": "🔒 Nenhuma Informação Pessoal Necessária (100% Anônimo)",
  "ratingLabel": "Avaliação do Serviço",
  "categoryLabel": "Serviço Utilizado (Opcional)",
  "contentLabel": "Comentário da Avaliação",
  "contentPlaceholder": "Fique à vontade para compartilhar sua experiência com nossos serviços, especialistas ou atendentes.",
  "emailNotice": "📧 Esta avaliação será enviada com segurança para o e-mail contact@life.help.",
  "submitBtn": "Enviar Avaliação (para contact@life.help)",
  "submittingBtn": "Enviando...",
  "successTitle": "Avaliação Enviada com Sucesso!",
  "successDesc": "Seu valioso feedback foi entregue ao e-mail contact@life.help. Obrigado por nos ajudar a melhorar nossos serviços!",
  "writeAnotherBtn": "Escrever Outra Avaliação",
  "homeBtn": "Voltar ao Início",
  "allServices": "Todos os Serviços",
  "emptyContentAlert": "Por favor, escreva sua avaliação.",
  "deliveredBadge": "Entregue ao E-mail do Administrador",
  "recipientEmailLabel": "E-mail do Destinatário:",
  "ratingEvalLabel": "Nível de Satisfação:",
  "relatedServiceLabel": "Serviço Relacionado:",
  "writtenContentLabel": "[Conteúdo da Avaliação Enviada]",
  "sentTimeLabel": "Enviado em:",
  "noPersonalInfoNote": "(Sem dados pessoais)",
  "starUnit": "estrelas",
  "rating_5": "Excelente (Muito satisfeito)",
  "rating_4": "Bom (Satisfeito)",
  "rating_3": "Regular",
  "rating_2": "Abaixo da média",
  "rating_1": "Insatisfeito"
}

el['review'] = {
  "title": "Αξιολόγηση Πελάτη",
  "subtitle": "Αφήστε τα σχόλιά σας χωρίς να εισαγάγετε προσωπικά στοιχεία. Η αξιολόγησή σας θα παραδοθεί απευθείας στη διαχείριση στο contact@life.help.",
  "anonymousBadge": "🔒 Δεν απαιτούνται προσωπικά στοιχεία (100% Ανώνυμο)",
  "ratingLabel": "Αξιολόγηση Υπηρεσίας",
  "categoryLabel": "Υπηρεσία που Χρησιμοποιήθηκε (Προαιρετικό)",
  "contentLabel": "Περιεχόμενο Αξιολόγησης",
  "contentPlaceholder": "Μοιραστείτε ελεύθερα την εμπειρία σας με τις υπηρεσίες, τους τεχνικούς ή τους συμβούλους μας.",
  "emailNotice": "📧 Αυτή η αξιολόγηση θα παραδοθεί με ασφάλεια στο email του διαχειριστή contact@life.help.",
  "submitBtn": "Υποβολή Αξιολόγησης (Αποστολή στο contact@life.help)",
  "submittingBtn": "Αποστολή...",
  "successTitle": "Η αξιολόγηση στάλθηκε επιτυχώς!",
  "successDesc": "Τα πολύτιμα σχόλιά σας παραδόθηκαν στο email contact@life.help. Σας ευχαριστούμε που μας βοηθάτε να βελτιωνόμαστε!",
  "writeAnotherBtn": "Γράψτε κι άλλη αξιολόγηση",
  "homeBtn": "Επιστροφή στην Αρχική",
  "allServices": "Όλες οι Υπηρεσίες",
  "emptyContentAlert": "Παρακαλώ εισαγάγετε το κείμενο της αξιολόγησής σας.",
  "deliveredBadge": "Παραδόθηκε στο Email Διαχειριστή",
  "recipientEmailLabel": "Email Παραλήπτη:",
  "ratingEvalLabel": "Βαθμός Ικανοποίησης:",
  "relatedServiceLabel": "Σχετική Υπηρεσία:",
  "writtenContentLabel": "[Περιεχόμενο Υποβληθείσας Αξιολόγησης]",
  "sentTimeLabel": "Ώρα Αποστολής:",
  "noPersonalInfoNote": "(Χωρίς προσωπικά στοιχεία)",
  "starUnit": "αστέρια",
  "rating_5": "Εξαιρετικό (Πολύ ικανοποιημένος)",
  "rating_4": "Καλό (Ικανοποιημένος)",
  "rating_3": "Μέτριο",
  "rating_2": "Κάτω του μετρίου",
  "rating_1": "Δυσαρεστημένος"
}

# Login
pt['login'] = {
  "title": "Entrar e Cadastrar-se",
  "subtitle": "Entre ou crie uma conta com seu e-mail",
  "emailLabel": "E-mail",
  "passwordLabel": "Senha",
  "signInBtn": "Entrar",
  "signUpBtn": "Cadastrar-se",
  "backHome": "← Voltar ao Início"
}

el['login'] = {
  "title": "Σύνδεση & Εγγραφή",
  "subtitle": "Συνδεθείτε ή δημιουργήστε λογαριασμό με το email σας",
  "emailLabel": "Email",
  "passwordLabel": "Κωδικός πρόσβασης",
  "signInBtn": "Σύνδεση",
  "signUpBtn": "Εγγραφή",
  "backHome": "← Επιστροφή στην Αρχική"
}

print("Basic sections for pt and el ready.")

