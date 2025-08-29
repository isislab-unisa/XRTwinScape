import Keycloak from "keycloak-js";
import { constants } from "./const/variables";
let isRefreshing = false;
let authenticated = false;

export const keycloak = new Keycloak({
    url: constants.AUTH_URL,
    realm: constants.AUTH_REALM,
    clientId: constants.AUTH_CLIENT,
    enableCors: true,
});

export const onLogin = () => {
    keycloak.login({ redirectUri: window.location.origin + "/" });
};

export const onLogout = () => {
    localStorage.removeItem("kc_token");
    keycloak.logout({ redirectUri: window.location.origin + "/" });
};

const startTokenRefresh = () => {
    setInterval(async () => {
        if (isRefreshing) return;
        isRefreshing = true;
        try {
            const refreshed = await keycloak.updateToken(30);
            if (refreshed) {
                localStorage.setItem("kc_token", keycloak.token);
            }
        } catch (error) {
            console.error("Token refresh failed", error);
            onLogin();
        } finally {
            isRefreshing = false;
        }
    }, 60000);
};

export const onUpdateTokenWithKeycloak = async () => {
    keycloak
        .updateToken(30)
        .then(() => {
            localStorage.setItem("kc_token", keycloak.token);
        })
        .error((error) => {
            console.log(error);
        });
};

export const onLoadUser = async () => {
    return keycloak
        .loadUserProfile()
        .then((profile) => {
            localStorage.setItem("user", JSON.stringify(profile));
        })
        .catch((error) => {
            console.log(error);
        });
};

keycloak.onAuthLogout = function () {
    localStorage.removeItem("kc_token");
};

keycloak.onAuthSuccess = function () {
    localStorage.setItem("kc_token", keycloak.token);
    onLoadUser();
    startTokenRefresh();
};

export async function authenticateKeycloak() {
    if(!authenticated)
    {
        authenticated = await keycloak.init({
            onLoad: 'login-required',
            checkLoginIframe: false
        });
    }

    if(authenticated)
    {
        try {
            await keycloak.updateToken(30);
            localStorage.setItem("kc_token", keycloak.token);
            console.log("Token refreshed:", keycloak.token);
        } catch (error) {
            console.error('Failed to refresh token:', error);
        }
    }
    else
    {
        console.error("User is not authenticated");
    }
    return authenticated;
}

export async function testToken() {
    const curToken = localStorage.getItem("kc_token");
    console.log("Current token from localStorage:", curToken);
    if(!curToken)
    {
        const authenticated = await keycloak.init({
            onLoad: 'login-required',
            checkLoginIframe: false
        });

        if(authenticated)
        {
            console.log("User is authenticated");
        }
        else
        {
            console.log("User is not authenticated");
        }
    }
    else
    {
        const authenticated = await keycloak.init({
            onLoad: 'login-required',
            token: curToken,
            checkLoginIframe: false
        });

        if(authenticated)
        {
            console.log("User is authenticated");
        }
        else
        {
            console.log("User is not authenticated");
        }
    }

    //onLogin();

    try {
        await keycloak.updateToken(30);
        const token = keycloak.token;
        console.log("Token refreshed:", token);
    } catch (error) {
        console.error('Failed to refresh token:', error);
    }
}