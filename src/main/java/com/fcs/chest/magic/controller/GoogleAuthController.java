package com.fcs.chest.magic.controller;

import java.io.IOException;
import java.util.Arrays;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import com.fcs.chest.magic.domain.DataHolder;
import com.fcs.chest.magic.domain.User;
import com.fcs.chest.magic.domain.UserHolder;
import com.fcs.chest.magic.util.UserUtils;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestFactory;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;
import com.google.api.services.drive.DriveScopes;

@Controller
@RequestMapping("auth/google")
public class GoogleAuthController {
	private static String CLIENT_ID = "660714249132.apps.googleusercontent.com";
	private static String CLIENT_SECRET = "4HdAX-G-88BThPr5R1kfOKFH";
	private static String REDIRECT_URI = "/auth/google/callback";
	private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo";
	
	@Autowired
	private DataHolder dataHolder;
	
	@Autowired
	private UserHolder userHolder;

	@Autowired
	private HttpServletRequest request;

	@RequestMapping("request")
	public String requestAuth() {
		GoogleAuthorizationCodeFlow flow = createFlow();

		String url = flow.newAuthorizationUrl().setRedirectUri(request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + request.getContextPath() + REDIRECT_URI)
				.build();
		return "redirect:" + url;
	}

	@RequestMapping("callback")
	public String responseAuth() throws IOException {
		JsonFactory jsonFactory = new JacksonFactory();
		GoogleAuthorizationCodeFlow flow = createFlow();

		String code = request.getParameter("code");
		//System.out.println("code=" + code);
		GoogleTokenResponse response = flow.newTokenRequest(code)
				.setRedirectUri(request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + request.getContextPath() + REDIRECT_URI).execute();
		GoogleCredential credential = new GoogleCredential()
				.setFromTokenResponse(response);

		dataHolder.setCredential(credential);
		//dataHolder.initialize();
		userHolder.setUser(UserUtils.parseUser(getUserInfoJson(credential, flow)));
		
		return "forward:/api/key/google/retrieve";
	}
	
	public String getUserInfoJson(Credential credential, GoogleAuthorizationCodeFlow flow) throws IOException {
		HttpTransport httpTransport = new NetHttpTransport();
		
        final HttpRequestFactory requestFactory = httpTransport.createRequestFactory(credential);
        // Make an authenticated request
        final GenericUrl url = new GenericUrl(USER_INFO_URL);
        final HttpRequest request = requestFactory.buildGetRequest(url);
        request.getHeaders().setContentType("application/json");
        final String jsonIdentity = request.execute().parseAsString();
        
        return jsonIdentity;

	}
	
	private GoogleAuthorizationCodeFlow createFlow(){
		HttpTransport httpTransport = new NetHttpTransport();
		JsonFactory jsonFactory = new JacksonFactory();
		
		GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
			httpTransport, jsonFactory, CLIENT_ID, CLIENT_SECRET,
			Arrays.asList((DriveScopes.DRIVE + ";https://www.googleapis.com/auth/userinfo.profile;https://www.googleapis.com/auth/userinfo.email").split(";"))).setAccessType("online")
			.setApprovalPrompt("auto").build();
		
		return flow;
	}
}
