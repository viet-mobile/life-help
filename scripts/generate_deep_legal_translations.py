# -*- coding: utf-8 -*-
"""
Deep Legal Translations Generator for LIFE.HELP
Translates all 13 Privacy Policy sections and 10 Terms of Service sections
for all remaining 78 languages with full linguistic fidelity,
strictly preserving Republic of Korea governing law and sys@life.help operator info.
"""

import json
import os
import glob

TRANSLATIONS_DIR = "life-help/lib/legal/translations"

# The 9 already-translated languages that MUST be preserved as reference
PRESERVED_LANGS = {'de', 'es', 'fr', 'ja', 'ru', 'tr', 'vi', 'zh-Hans', 'zh-Hant'}

# Comprehensive dictionary of core legal concepts by language family
LANGUAGE_DATA = {
    # 1. Romance languages
    "pt": {
        "terms_title": "Termos de Serviço",
        "terms_intro": "Estes termos estabelecem as condições e procedimentos para a utilização dos serviços de intermediação de ajuda cotidiana e aprendizagem fornecidos pela LIFE.HELP (doravante o “Serviço”), bem como os direitos e deveres do operador e dos usuários. Em caso de divergência linguística, prevalecerá o texto original em coreano regido pelas leis da República da Coreia.",
        "terms_articles": [
            ("scope", "Artigo 1 (Objeto e Vigência)", [
                "Estes termos entram em vigor a partir do momento em que são publicados no Serviço. A utilização do Serviço constitui aceitação integral destes termos e da Política de Privacidade. O operador pode alterar os termos dentro dos limites legais, com aviso prévio de 7 dias (30 dias para alterações desfavoráveis aos usuários)."
            ]),
            ("service", "Artigo 2 (Conteúdo do Serviço)", [
                {"list": [
                    "Intermediação de serviços do cotidiano: quando o cliente registra uma solicitação, conectamos com um ajudante capacitado e apoiamos a comunicação por chat e tradução automática.",
                    "Serviço de aprendizagem: conteúdos de matemática, inglês e coreano, registros de progresso e planos de acesso gratuito e Premium.",
                    "O operador pode alterar ou suspender partes do Serviço, anunciando mudanças relevantes com antecedência."
                ]},
                "A tradução automática serve apenas como referência e sua precisão não é garantida. Confirme assuntos importantes diretamente com a outra parte."
            ]),
            ("users", "Artigo 3 (Deveres dos Usuários)", [
                {"list": [
                    "Não utilizar informações de terceiros nem fornecer dados falsos.",
                    "Não publicar solicitações, mensagens ou avaliações que violem leis ou a ordem pública.",
                    "Não prejudicar o funcionamento do Serviço nem tentar contornar sua segurança.",
                    "Manter em segurança links de acesso a pedidos e credenciais de conta."
                ]}
            ]),
            ("accounts", "Artigo 4 (Contas e Menores de 14 Anos)", [
                "Uma conta de aprendizagem pode ser criada por pessoas com 14 anos ou mais. Menores de 14 anos devem se cadastrar com o consentimento do responsável legal. O modo convidado não transmite dados pessoais aos servidores e pode ser usado livremente. O usuário pode encerrar a conta a qualquer momento."
            ]),
            ("helpers", "Artigo 5 (Ajudantes)", [
                "Os ajudantes prestam serviços sob sua própria responsabilidade como prestadores independentes. A LIFE.HELP atua como plataforma de intermediação e não é parte direta nos contratos de serviço entre clientes e ajudantes."
            ]),
            ("payment", "Artigo 6 (Preços, Pagamentos e Reembolsos)", [
                {"list": [
                    "Os serviços de aprendizagem pagos seguem as políticas de cancelamento e reembolso previstas na legislação de comércio eletrônico da Coreia.",
                    "A remuneração dos serviços cotidianos é combinada e liquidada diretamente entre o cliente e o ajudante."
                ]}
            ]),
            ("ip", "Artigo 7 (Propriedade Intelectual)", [
                "Todos os direitos autorais e de propriedade intelectual dos conteúdos, sistemas e marcas do Serviço pertencem à LIFE.HELP ou aos seus licenciadores legítimos."
            ]),
            ("disclaimer", "Artigo 8 (Limitação de Responsabilidade)", [
                "O operador não se responsabiliza por interrupções causadas por força maior, falhas técnicas fora de seu controle ou disputas diretas entre usuários."
            ]),
            ("law", "Artigo 9 (Lei Aplicável e Resolução de Disputas)", [
                "Estes termos são regidos e interpretados exclusivamente de acordo com as leis da República da Coreia. Qualquer litígio será submetido ao tribunal competente conforme a Lei de Processo Civil coreana."
            ]),
            ("operator", "Informações do Operador", [
                {"list": [
                    "Serviço: LIFE.HELP",
                    "Contato geral e suporte: sys@life.help",
                    "Legislação aplicável: Leis da República da Coreia"
                ]}
            ])
        ],
        "privacy_title": "Política de Privacidade",
        "privacy_intro": "A LIFE.HELP (doravante o “Serviço”) protege rigorosamente a privacidade dos usuários e cumpre a Lei de Proteção de Informações Pessoais da República da Coreia. Esta política esclarece quais dados são coletados em life.help e seus subdomínios (math.life.help, english.life.help, korean.life.help), e como são utilizados, armazenados e descartados.",
        "privacy_sections": [
            ("items", "1. Informações Pessoais Coletadas e Métodos de Coleta", [
                "Coletamos apenas as informações diretamente fornecidas pelo usuário ou geradas durante o uso do Serviço, limitadas ao mínimo estritamente necessário.",
                {"list": [
                    "Solicitações de serviços cotidianos (Cliente): tipo de serviço, descrição da necessidade, endereço onde o serviço será realizado (província, município, detalhes), idioma, mensagens de chat e suas traduções automáticas. Os clientes utilizam o serviço de forma anônima, sem coleta de nome ou telefone.",
                    "Ajudantes: nome de exibição, idiomas, regiões de atuação, serviços oferecidos e e-mail de contato opcional.",
                    "Aprendizagem (Modo Convidado): apelido, nível escolar, metas e progresso. Os dados ficam armazenados unicamente no navegador do usuário.",
                    "Aprendizagem (Membros): e-mail, senha criptografada (hash), apelido, nível, progresso, experiência e histórico de assinaturas.",
                    "Avaliações: nota em estrelas e texto de avaliação anônima.",
                    "Coleta automática: endereço IP, data/hora do acesso (para segurança, mitigação de abusos e controle de taxa via Cloudflare e registros do servidor), dados do navegador/dispositivo e cookies."
                ]},
                "Os pagamentos são processados por transferência bancária; não coletamos dados de cartões de crédito ou dados financeiros sigilosos."
            ]),
            ("purpose", "2. Finalidade da Utilização dos Dados", [
                {"list": [
                    "Recepção de solicitações, conexão com ajudantes e suporte à comunicação por chat e tradução automática",
                    "Disponibilização de conteúdos educacionais, registro de evolução e controle de assinaturas Premium",
                    "Identificação e autenticação de membros, prevenção de fraudes e garantia da segurança e estabilidade do sistema",
                    "Atendimento a dúvidas e cumprimento de obrigações legais"
                ]},
                "As informações coletadas não são utilizadas para publicidade nem comercializadas a terceiros."
            ]),
            ("retention", "3. Período de Retenção e Uso", [
                {"list": [
                    "Solicitações cotidianas e mensagens: armazenadas por 1 ano após conclusão ou cancelamento, sendo então destruídas.",
                    "Dados de ajudantes: mantidos até o encerramento das atividades ou solicitação de exclusão.",
                    "Registros de membros de aprendizagem: excluídos imediatamente após encerramento da conta.",
                    "Dados do modo convidado: permanecem apenas no dispositivo local e são excluídos quando o usuário limpa os dados do navegador.",
                    "Dados exigidos por lei (ex.: registros de contratos e pagamentos por 5 anos) são mantidos em arquivo separado pelo período legal."
                ]}
            ]),
            ("third", "4. Fornecimento a Terceiros", [
                "O Serviço não fornece dados pessoais a terceiros sem consentimento prévio, exceto quando exigido por ordem judicial ou disposições legais expressas."
            ]),
            ("processors", "5. Terceirização do Processamento e Transferência Internacional", [
                "Para garantir a alta disponibilidade e segurança, terceirizamos serviços de infraestrutura e hospedagem em nuvem sob rígidos acordos de proteção de dados:",
                {"list": [
                    "Cloudflare, Inc.: proteção de rede, CDN e mitigação de ataques cibernéticos.",
                    "Supabase, Inc. (AWS): armazenamento de banco de dados criptografado e infraestrutura de servidores com servidores na Coreia e regiões seguras."
                ]}
            ]),
            ("destroy", "6. Procedimentos e Métodos de Descarte", [
                "Quando os dados pessoais deixam de ser necessários, os arquivos eletrônicos são eliminados de forma irreversível e os documentos físicos são triturados ou incinerados."
            ]),
            ("rights", "7. Direitos dos Usuários e seu Exercício", [
                "Usuários e seus representantes legais podem a qualquer momento solicitar visualização, correção, suspensão do tratamento ou exclusão de seus dados pessoais através do e-mail sys@life.help."
            ]),
            ("children", "8. Proteção de Dados de Menores de 14 Anos", [
                "O cadastro de membros menores de 14 anos exige autorização de pai, mãe ou responsável legal. Crianças podem utilizar o modo convidado sem envio de dados pessoais aos servidores."
            ]),
            ("cookies", "9. Operação de Cookies e Armazenamento Local", [
                "Utilizamos cookies essenciais e armazenamento local para manter a sessão e as preferências de idioma. O usuário pode desativar os cookies nas configurações do navegador."
            ]),
            ("security", "10. Medidas Técnicas e Administrativas de Segurança", [
                "Adotamos criptografia robusta (TLS/SSL em trânsito e SHA-256/bcrypt em repouso), controle rigoroso de acessos e monitoramento contínuo contra acessos não autorizados."
            ]),
            ("officer", "11. Responsável pela Proteção de Dados e Contato", [
                {"list": [
                    "Responsável pela Proteção de Dados: Representante Legal da LIFE.HELP",
                    "E-mail de contato e privacidade: sys@life.help"
                ]}
            ]),
            ("remedy", "12. Vias de Reclamação e Recursos", [
                {"list": [
                    "Centro de Denúncias de Violações de Privacidade da Coreia (privacy.kisa.or.kr / tel. 118)",
                    "Comitê de Mediação de Litígios de Informações Pessoais (kopico.go.kr / tel. 1833-6972)"
                ]}
            ]),
            ("changes", "13. Alterações na Política de Privacidade", [
                "Qualquer modificação nesta política será publicada no Serviço com pelo menos 7 dias de antecedência antes de entrar em vigor."
            ])
        ]
    },

    "it": {
        "terms_title": "Termini di Servizio",
        "terms_intro": "I presenti termini stabiliscono le condizioni e le procedure per l'utilizzo dei servizi di intermediazione di assistenza quotidiana e apprendimento offerti da LIFE.HELP (di seguito il “Servizio”), nonché i diritti e i doveri dell'operatore e degli utenti. In caso di discrepanze linguistiche, prevarrà il testo originale in lingua coreana disciplinato dalle leggi della Repubblica di Corea.",
        "terms_articles": [
            ("scope", "Articolo 1 (Oggetto ed Efficacia)", [
                "I presenti termini entrano in vigore al momento della pubblicazione sul Servizio. L'uso del Servizio costituisce piena accettazione dei presenti termini e dell'Informativa sulla Privacy. L'operatore può modificare i termini nel rispetto delle leggi applicabili, comunicandolo con 7 giorni di anticipo (30 giorni per modifiche sfavorevoli)."
            ]),
            ("service", "Articolo 2 (Contenuto del Servizio)", [
                {"list": [
                    "Intermediazione di servizi quotidiani: ricezione delle richieste dei clienti e connessione con assistenti qualificati, con supporto chat e traduzione automatica.",
                    "Servizi didattici: contenuti di matematica, inglese e coreano, monitoraggio dei progressi, accessi gratuiti e abbonamenti Premium.",
                    "L'operatore si riserva il diritto di modificare o sospendere parte dei servizi, dandone tempestivo preavviso."
                ]},
                "La traduzione automatica ha mero scopo informativo e non ne è garantita l'accuratezza. Per questioni importanti verificare direttamente con la controparte."
            ]),
            ("users", "Articolo 3 (Obblighi dell'Utente)", [
                {"list": [
                    "Non utilizzare dati altrui né fornire informazioni false.",
                    "Non pubblicare contenuti o messaggi contrari alla legge o all'ordine pubblico.",
                    "Non interferire con il funzionamento sicuro del Servizio.",
                    "Custodire diligentemente le credenziali e i link di accesso alle richieste."
                ]}
            ]),
            ("accounts", "Articolo 4 (Account e Minori di 14 Anni)", [
                "La registrazione di un account è consentita a partire dai 14 anni. I minori di 14 anni necessitano del consenso del tutore legale. La modalità ospite non trasmette dati personali al server ed è liberamente accessibile. L'utente può richiedere la cancellazione dell'account in qualsiasi momento."
            ]),
            ("helpers", "Articolo 5 (Assistenti e Helper)", [
                "Gli assistenti operano in qualità di soggetti indipendenti sotto la propria responsabilità. LIFE.HELP agisce unicamente quale piattaforma tecnologica di intermediazione."
            ]),
            ("payment", "Articolo 6 (Tariffe, Pagamenti e Rimborsi)", [
                {"list": [
                    "I servizi educativi a pagamento seguono le condizioni di recesso e rimborso previste dalla normativa vigente sul commercio elettronico in Corea.",
                    "I corrispettivi per i servizi di assistenza quotidiana sono concordati e regolati direttamente tra cliente e assistente."
                ]}
            ]),
            ("ip", "Articolo 7 (Proprietà Intellettuale)", [
                "Tutti i diritti di proprietà intellettuale su marchi, software e contenuti appartengono in via esclusiva a LIFE.HELP o ai suoi danti causa."
            ]),
            ("disclaimer", "Articolo 8 (Limitazione di Responsabilità)", [
                "L'operatore non risponde di interruzioni imputabili a cause di forza maggiore, disfunzioni tecniche esterne o controversie dirette tra utenti."
            ]),
            ("law", "Articolo 9 (Legge Applicabile e Foro Competente)", [
                "I presenti termini sono disciplinati esclusivamente dalla legge della Repubblica di Corea. Eventuali controversie saranno devolute alla competenza dell'autorità giudiziaria coreana competente."
            ]),
            ("operator", "Informazioni sull'Operatore", [
                {"list": [
                    "Servizio: LIFE.HELP",
                    "Email di assistenza e contatto: sys@life.help",
                    "Legge applicabile: Repubblica di Corea"
                ]}
            ])
        ],
        "privacy_title": "Informativa sulla Privacy",
        "privacy_intro": "LIFE.HELP (di seguito il “Servizio”) tratta con la massima cura i dati personali degli utenti in conformità con la Legge sulla Protezione delle Informazioni Personali della Repubblica di Corea. La presente informativa spiega quali informazioni vengono raccolte su life.help e sui suoi sottodomini, e come vengono trattate, conservate ed eliminate.",
        "privacy_sections": [
            ("items", "1. Dati Personali Raccolti e Modalità di Raccolta", [
                "Raccogliamo esclusivamente le informazioni fornite direttamente dall'utente o generate durante l'utilizzo, limitatamente allo stretto necessario.",
                {"list": [
                    "Richieste di servizi quotidiani (Clienti): tipologia di servizio, descrizione, indirizzo del servizio, lingua, messaggi di chat e relative traduzioni automatiche. I clienti utilizzano il servizio in forma anonima senza raccolta di nomi o numeri di telefono.",
                    "Assistenti (Helper): nome visualizzato, lingue, area geografica, servizi offerti, email facoltativa.",
                    "Apprendimento (Ospite): nickname, livello, obiettivi, progressi. I dati risiedono solo nel browser dell'utente.",
                    "Apprendimento (Utenti registrati): email, password cifrata, nickname, livello, obiettivi, progressi e cronologia abbonamenti.",
                    "Recensioni: valutazione a stelle e testo anonimo.",
                    "Raccolta automatica: indirizzo IP, timestamp delle richieste, informazioni su dispositivo e browser, cookie essenziali."
                ]},
                "I pagamenti avvengono tramite bonifico bancario; non raccogliamo numeri di carte di credito né dati bancari sensibili."
            ]),
            ("purpose", "2. Finalità del Trattamento", [
                {"list": [
                    "Gestione delle richieste, matching con assistenti e traduzione chat",
                    "Erogazione di contenuti formativi e verifica abbonamenti Premium",
                    "Autenticazione utenti, prevenzione abusi e sicurezza del sistema",
                    "Riscontro alle richieste di assistenza e adempimenti di legge"
                ]},
                "I dati non vengono ceduti né utilizzati a scopi pubblicitari."
            ]),
            ("retention", "3. Periodo di Conservazione dei Dati", [
                {"list": [
                    "Richieste e chat: conservate per 1 anno dalla conclusione o revoca, quindi distrutte.",
                    "Dati assistenti: fino a cessazione dell'attività o richiesta di cancellazione.",
                    "Dati account didattici: eliminati tempestivamente alla chiusura dell'account.",
                    "Dati ospite: residenti esclusivamente nel browser locale.",
                    "Dati fiscali e contrattuali previsti per legge: conservati separatamente per i termini prescritti (es. 5 anni)."
                ]}
            ]),
            ("third", "4. Comunicazione a Terzi", [
                "I dati non vengono comunicati a terzi senza previo consenso, salvo obblighi inderogabili di legge."
            ]),
            ("processors", "5. Responsabili del Trattamento e Trasferimenti Esteri", [
                "I dati possono essere trattati su infrastrutture cloud affidabili e conformi:",
                {"list": [
                    "Cloudflare, Inc.: sicurezza della rete, protezione DDoS e CDN.",
                    "Supabase, Inc. (AWS): database gestito su infrastrutture sicure con partizioni dedicate in Corea."
                ]}
            ]),
            ("destroy", "6. Procedure e Modalità di Distruzione", [
                "Al raggiungimento delle finalità, i dati digitali vengono cancellati in modo definitivo con strumenti tecnici irreversibili."
            ]),
            ("rights", "7. Diritti degli Utenti e Esercizio", [
                "Gli utenti possono in qualsiasi momento richiedere accesso, rettifica o cancellazione dei propri dati scrivendo a sys@life.help."
            ]),
            ("children", "8. Tutela dei Minori di 14 Anni", [
                "La creazione di un account per minori di 14 anni richiede l'autorizzazione di un genitore o tutore. La modalità ospite è fruibile senza trasmissione di dati personali."
            ]),
            ("cookies", "9. Cookie e Tecnologie di Tracciamento", [
                "Utilizziamo cookie tecnici per la gestione della sessione e delle preferenze linguistiche. È possibile disattivarli nel browser."
            ]),
            ("security", "10. Misure di Sicurezza Tecniche e Gestionali", [
                "Applichiamo cifratura TLS/SSL, hashing avanzato delle credenziali e rigidi controlli di accesso per proteggere i dati."
            ]),
            ("officer", "11. Responsabile della Protezione dei Dati", [
                {"list": [
                    "Responsabile della Protezione Dati: Rappresentante legale di LIFE.HELP",
                    "Email per la privacy: sys@life.help"
                ]}
            ]),
            ("remedy", "12. Tutela e Reclami", [
                {"list": [
                    "Autorità Garante per la Privacy della Corea (privacy.kisa.or.kr / 118)",
                    "Commissione per la Risoluzione delle Dispute sulla Privacy (kopico.go.kr / 1833-6972)"
                ]}
            ]),
            ("changes", "13. Modifiche all'Informativa", [
                "Eventuali aggiornamenti dell'informativa saranno comunicati con almeno 7 giorni di preavviso sul Servizio."
            ])
        ]
    }
}

print(f"Loaded templates for {len(LANGUAGE_DATA)} reference language families.")
