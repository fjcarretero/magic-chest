package com.fcs.chest.magic.controller;

import java.net.InetSocketAddress;
import java.net.MalformedURLException;
import java.net.Proxy;
import java.net.URL;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import com.dropbox.core.DbxAppInfo;
import com.dropbox.core.DbxAuthFinish;
import com.dropbox.core.DbxException;
import com.dropbox.core.DbxRequestConfig;
import com.dropbox.core.DbxSessionStore;
import com.dropbox.core.DbxStandardSessionStore;
import com.dropbox.core.DbxWebAuth;
import com.dropbox.core.DbxWebAuth.BadRequestException;
import com.dropbox.core.DbxWebAuth.BadStateException;
import com.dropbox.core.DbxWebAuth.CsrfException;
import com.dropbox.core.DbxWebAuth.NotApprovedException;
import com.dropbox.core.DbxWebAuth.ProviderException;
import com.dropbox.core.http.StandardHttpRequestor;
import com.dropbox.core.util.LangUtil;

@Controller
@RequestMapping("auth/dropbox")
public class DbxAuthController {
	final String APP_KEY = "zziq3ikneh2k5bn";
    final String APP_SECRET = "5e76mc6wcnfemeb";
	 @Autowired 
	 private HttpServletRequest request;
	 
	 @Autowired
	 private HttpSession session;
	
	@RequestMapping("request")
	public String requestAuthToDBX() {
		return "redirect:" + getWebAuth().start();
	}

	@RequestMapping("callback")
	public String responseAuthFromDBX() throws BadRequestException, BadStateException, CsrfException, NotApprovedException, ProviderException, DbxException {
		DbxAuthFinish authFinish = getWebAuth().finish(request.getParameterMap());
		session.setAttribute("accessToken", authFinish.accessToken);
		System.out.println("AT=" + authFinish.accessToken);
		return "redirect:/";
	}
	
	private String getUrl(String path) {
        URL requestUrl;
        try {
            requestUrl = new URL(request.getRequestURL().toString());
            return new URL(requestUrl, request.getContextPath() + path).toExternalForm();
        }
        catch (MalformedURLException ex) {
            throw LangUtil.mkAssert("Bad URL", ex);
        }
    }
	
	private DbxWebAuth getWebAuth()
    {
        // After we redirect the user to the Dropbox website for authorization,
        // Dropbox will redirect them back here.
        String redirectUrl = getUrl("/auth/dropbox/callback");
        String http_proxy = System.getenv("http_proxy");
        StandardHttpRequestor httpRequestor = null;
        if (http_proxy != null) {
        	System.out.println(http_proxy);
        	URL url;
			try {
				url = new URL(http_proxy);
				httpRequestor = new StandardHttpRequestor(new Proxy(Proxy.Type.HTTP, new InetSocketAddress(url.getHost(), url.getPort())));
			} catch (MalformedURLException e) {
				httpRequestor = new StandardHttpRequestor();
			}
        } else {
        	httpRequestor = new StandardHttpRequestor();
        }
        DbxRequestConfig config = new DbxRequestConfig("magic-chest", request.getLocale().toString(), httpRequestor);
        
        DbxAppInfo appInfo = new DbxAppInfo(APP_KEY, APP_SECRET);
        // Select a spot in the session for DbxWebAuth to store the CSRF token.
        String sessionKey = "dropbox-auth-csrf-token";
        DbxSessionStore csrfTokenStore = new DbxStandardSessionStore(session, sessionKey);
        
        session.setAttribute("config", config);

        return new DbxWebAuth(config, appInfo, redirectUrl, csrfTokenStore);
    }
}
