package com.fcs.chest.magic.security;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import com.fcs.chest.magic.domain.DataHolder;

public class CredentialsAccessInterceptor extends HandlerInterceptorAdapter {
	
	@Autowired
	private DataHolder dataHolder;
	
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		
        //System.out.println("accessToken=" + dataHolder.getCredential());
		if (dataHolder.getCredential() != null) {
            return true;
        } else {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
            return false;
        }
    }
}
