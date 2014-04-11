package com.fcs.chest.magic.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import com.fcs.chest.magic.domain.DataHolder;
import com.fcs.chest.magic.domain.UserHolder;

@Controller
public class NavigationController {

	@Autowired
	private DataHolder dataHolder;
	
	@Autowired
	private UserHolder userHolder;
	
	@RequestMapping("login")
	public ModelAndView login(){
		ModelAndView mav = new ModelAndView();
		mav.setViewName("login");
		return mav;
	}
	
	@RequestMapping("main")
	public ModelAndView main(){
		ModelAndView mav = new ModelAndView();
		if (dataHolder.getCredential() == null){
			mav.setViewName("login");
		} else {
			//System.out.println("email=" + userHolder.getUser().getEmail());
			mav.setViewName("main");
			mav.getModelMap().addAttribute("email", userHolder.getUser().getEmail());
		}
		return mav;
	}
}
