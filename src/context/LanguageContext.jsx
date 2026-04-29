// src/context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  pt: {
    menu_about: 'Sobre', menu_sust: 'Login', menu_invest: 'Cadastrar', menu_contact: 'Contato',
    title: 'Biar Investment', subtitle: 'O seu dinheiro fluirá como um rio',
    main_text: 'A Biar Investments foca no crescimento sustentável e na gestão inteligente de ativos digitais para garantir o seu futuro financeiro.',
    card_title: 'BITCOIN',
    about_title: 'Sobre', about_purpose_tag: 'Our Purpose',
    about_purpose_title_1: 'Investindo com', about_purpose_title_2: 'Integridade', about_purpose_title_3: 'e', about_purpose_title_4: 'Visão',
    about_val1_title: 'Gestão Orientada a Valores', about_val1_desc: 'Na Biar Legacy, acreditamos que a gestão de fortunas vai além dos números. Nosso foco é orientado por fortes valores, garantindo que seu patrimônio reflita seus princípios éticos.',
    about_val2_title: 'Excelência Fiduciária', about_val2_desc: 'Como uma instituição estritamente fiduciária, atuamos sempre no seu melhor interesse. Sem comissões ocultas—apenas gestão de portfólio transparente e personalizada para seus objetivos.',
    about_val3_title: 'Crescimento com Risco Gerenciado', about_val3_desc: 'Nós ativamente gerenciamos o risco, balanceando crescimento com preservação de capital.',
    about_team_tag: 'Nossa Equipe', about_team_title: 'Profissionais na Empresa',
    about_team_desc: 'Nossa plataforma fundadora alinha as probabilidades a seu favor.',
    about_p1_name: 'Paulo Wittor', about_p1_desc: 'Desenvolvedor front-end, responsável pelo design do site.',
    about_p2_name: 'Enzo Marinelli', about_p2_desc: 'Desenvolvedor back-end, responsavél pelo funcionamento do site.',
    about_p3_name: 'Leandro do Amaral', about_p3_desc: 'Minha maior inspiração é o Bill Gates.',
    about_p4_name: 'Caroline Xavier', about_p4_desc: 'Só quem se arrisca merece viver o extraordinário.',
    about_p5_name: 'Geovanna Pereira', about_p5_desc: 'Se não pode fazer tudo, faça tudo que puder.',
    about_p6_name: 'Rebeca Medeiros', about_p6_desc: 'Isaias 60:22.',
    about_p7_name: 'Manuella Jacomo', about_p7_desc: 'O que vale é o esforço',
    about_p8_name: 'Gustavo Barbosa', about_p8_desc: 'Algo tipo isso.',
    about_journey_tag: 'Nossa Jornada', about_journey_title1: 'Traçando o', about_journey_title2: 'Futuro', about_journey_title3: 'da Gestão',
    about_journey_desc: 'Desde a nossa fundação, somos movidos por uma única visão.',
    contact_title: 'Contato', contact_card2_title: 'Sobre Preços', contact_card2_press: 'Assessoria de Imprensa', contact_card3_title: 'Relações Institucionais',
    login_home: ' Home', login_title: 'Entrar na Biar', login_user_lbl: 'Usuário', login_user_ph: '@seu_usuario',
    login_email_lbl: 'Email', login_email_ph: 'nome@email.com', login_btn: 'ENTRAR', login_or: 'OU',
    login_google: ' Entrar com o Google', login_no_acc: 'Não tem uma conta?', login_signup: 'Cadastre-se',
    sign_title: 'Criar conta', sign_pass_lbl: 'Senha', sign_pass_ph: 'Senha Forte', sign_btn: 'CRIAR CONTA',
    sign_google: ' Cadastrar com o Google', sign_have_acc: 'Já tem uma conta?', sign_signin: 'Faça Login',
    terms_policy: 'Termos de Uso | Política de Privacidade',
    err_auth_fill: 'Preencha usuário ou e-mail e a senha.',
    err_auth_fill_all: 'Preencha usuário, e-mail e senha.',
    err_auth_short_pass: 'A senha deve ter pelo menos 6 caracteres.',
    err_auth_duplicate: 'E-mail ou usuário já cadastrado.',
    err_auth_invalid: 'Dados incorretos. Verifique e tente de novo.',
    err_auth_network: 'Não foi possível conectar ao servidor. Inicie a API (npm run server).',
    err_auth_server: 'Erro no servidor. Tente mais tarde.',
    error_desc: 'Página não encontrada', error_btn: 'Voltar para o Início',
    verify_title: 'Verificação', verify_sub: 'Digite o código enviado ao seu email',
    verify_code_lbl: 'Código', verify_code_ph: '6 dígitos', verify_btn: 'VERIFICAR',
    verify_resend: 'Reenviar código', verify_sent: 'Código reenviado!', verify_wait: 'Aguarde {s}s',
    err_verify_fill: 'Preencha o código.', err_verify_invalid: 'Código inválido ou expirado.',
    footer_rights: '© Copyright 2025 BIAR Todos os direitos reservados.'
  },
  en: {
    menu_about: 'About', menu_sust: 'Log In', menu_invest: 'Sign Up', menu_contact: 'Contact',
    title: 'Biar Investment', subtitle: 'Your money will flow like a river',
    main_text: 'Biar Investments focuses on sustainable growth and intelligent digital asset management to secure your financial future.',
    card_title: 'BITCOIN',
    about_title: 'About', about_purpose_tag: 'Our Purpose',
    about_purpose_title_1: 'Investing with', about_purpose_title_2: 'Integrity', about_purpose_title_3: 'and', about_purpose_title_4: 'Vision',
    about_val1_title: 'Values-Driven Stewardship', about_val1_desc: 'At Biar Legacy, we believe wealth management is more than just numbers.',
    about_val2_title: 'Fiduciary Excellence', about_val2_desc: 'As a pure fiduciary, we are legally bound to act in your best interest.',
    about_val3_title: 'Risk-Managed Growth', about_val3_desc: 'We actively manage risk in-house, balancing growth with preservation.',
    about_team_tag: 'Our Team', about_team_title: 'Professionals at the Company',
    about_team_desc: 'Our comprehensive founder platform shifts the odds.',
    about_p1_name: 'Paulo Wittor', about_p1_desc: 'Professional Front-end Developer.',
    about_p2_name: 'Enzo Marinelli', about_p2_desc: 'Strategic analyst and partner.',
    about_p3_name: 'Leandro do Amaral', about_p3_desc: 'Financial strategist.',
    about_p4_name: 'Caroline Xavier', about_p4_desc: 'Operations director.',
    about_journey_tag: 'Our Journey', about_journey_title1: 'Charting the', about_journey_title2: 'Future', about_journey_title3: 'of Stewardship',
    about_journey_desc: 'From our inception, Biar Legacy has been driven by a single vision.',
    contact_title: 'Contact', contact_card2_title: 'About Prices', contact_card2_press: 'Press Inquiries', contact_card3_title: 'Investor Relations',
    login_home: ' Home', login_title: 'Sign in to Biar', login_user_lbl: 'Username', login_user_ph: '@your_username',
    login_email_lbl: 'Email', login_email_ph: 'name@work-email.com', login_btn: 'LOG IN', login_or: 'OR',
    login_google: ' Sign in with Google', login_no_acc: "Don't have an account?", login_signup: 'Sign up',
    sign_title: 'Create account', sign_pass_lbl: 'Password', sign_pass_ph: 'Strong Password', sign_btn: 'CREATE ACCOUNT',
    sign_google: ' Sign up with Google', sign_have_acc: 'Already have an account?', sign_signin: 'Sign in',
    terms_policy: 'Terms of Use | Privacy policy',
    err_auth_fill: 'Enter username or email and password.',
    err_auth_fill_all: 'Fill in username, email, and password.',
    err_auth_short_pass: 'Password must be at least 6 characters.',
    err_auth_duplicate: 'Email or username is already registered.',
    err_auth_invalid: 'Invalid credentials. Please try again.',
    err_auth_network: 'Could not reach the server. Start the API (npm run server).',
    err_auth_server: 'Server error. Try again later.',
    error_desc: 'Page not found', error_btn: 'Return to Home',
    verify_title: 'Verification', verify_sub: 'Enter the code sent to your email',
    verify_code_lbl: 'Code', verify_code_ph: '6 digits', verify_btn: 'VERIFY',
    verify_resend: 'Resend code', verify_sent: 'Code sent!', verify_wait: 'Wait {s}s',
    err_verify_fill: 'Please enter the code.', err_verify_invalid: 'Invalid or expired code.',
    footer_rights: '© Copyright 2025 BIAR All rights reserved.'
  },
  es: {
    menu_about: 'Sobre', menu_sust: 'Acceso', menu_invest: 'Registro', menu_contact: 'Contacto',
    title: 'Biar Investment', subtitle: 'Tu dinero fluirá como un río',
    main_text: 'Biar Investments se centra en el crecimiento sostenible y la gestión inteligente de activos digitales.',
    card_title: 'BITCOIN',
    about_title: 'Sobre', about_purpose_tag: 'Nuestro Propósito',
    about_purpose_title_1: 'Invirtiendo con', about_purpose_title_2: 'Integridad', about_purpose_title_3: 'y', about_purpose_title_4: 'Visión',
    about_val1_title: 'Gestión Guiada por Valores', about_val1_desc: 'En Biar Legacy, creemos que la gestión de fortunas va más allá de los números.',
    about_val2_title: 'Excelencia Fiduciaria', about_val2_desc: 'Como fiduciarios, operamos en su mejor interés.',
    about_val3_title: 'Crecimiento y Riesgo Calculado', about_val3_desc: 'Manejamos el riesgo de forma inteligente.',
    about_team_tag: 'Nuestro Equipo', about_team_title: 'Profesionales de la Empresa',
    about_team_desc: 'Nuestra plataforma directiva inclina las probabilidades a su favor.',
    about_p1_name: 'Paulo Wittor', about_p1_desc: 'Desarrollador Front-end.',
    about_p2_name: 'Enzo Marinelli', about_p2_desc: 'Analista estratégico.',
    about_p3_name: 'Leandro do Amaral', about_p3_desc: 'Estratega financiero.',
    about_p4_name: 'Caroline Xavier', about_p4_desc: 'Directora de operaciones.',
    about_journey_tag: 'Nuestro Viaje', about_journey_title1: 'Delineando el', about_journey_title2: 'Futuro', about_journey_title3: 'de la Gestión',
    about_journey_desc: 'Desde nuestra fundación nos motiva una única visión.',
    contact_title: 'Contacto', contact_card2_title: 'Sobre Precios', contact_card2_press: 'Asesoría de Prensa', contact_card3_title: 'Relaciones con Inversores',
    login_home: ' Inicio', login_title: 'Iniciar sesión en Biar', login_user_lbl: 'Usuario', login_user_ph: '@su_usuario',
    login_email_lbl: 'Correo', login_email_ph: 'nombre@correo.com', login_btn: 'ENTRAR', login_or: 'O',
    login_google: ' Acceder con Google', login_no_acc: '¿No tienes cuenta?', login_signup: 'Regístrate',
    sign_title: 'Crear cuenta', sign_pass_lbl: 'Contraseña', sign_pass_ph: 'Contraseña Fuerte', sign_btn: 'CREAR CUENTA',
    sign_google: ' Registrar con Google', sign_have_acc: '¿Ya tienes una cuenta?', sign_signin: 'Inicia sesión',
    terms_policy: 'Términos de Uso | Política de Privacidad',
    err_auth_fill: 'Completa usuario o correo y la contraseña.',
    err_auth_fill_all: 'Completa usuario, correo y contraseña.',
    err_auth_short_pass: 'La contraseña debe tener al menos 6 caracteres.',
    err_auth_duplicate: 'El correo o usuario ya está registrado.',
    err_auth_invalid: 'Datos incorrectos. Inténtalo de nuevo.',
    err_auth_network: 'No se pudo conectar al servidor. Inicia la API (npm run server).',
    err_auth_server: 'Error del servidor. Intenta más tarde.',
    error_desc: 'Página no encontrada', error_btn: 'Volver al Inicio',
    verify_title: 'Verificación', verify_sub: 'Ingresa el código enviado a tu correo',
    verify_code_lbl: 'Código', verify_code_ph: '6 dígitos', verify_btn: 'VERIFICAR',
    verify_resend: 'Reenviar código', verify_sent: '¡Código enviado!', verify_wait: 'Espera {s}s',
    err_verify_fill: 'Introduce el código.', err_verify_invalid: 'Código no válido o expirado.',
    footer_rights: '© Copyright 2025 BIAR Todos los derechos reservados.'
  }
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('userLang') || 'pt')

  const changeLanguage = (newLang) => {
    setLang(newLang)
    localStorage.setItem('userLang', newLang)
  }

  const t = (key) => translations[lang]?.[key] || key

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
