require 'spec_helper'

describe HomeController do

  render_views
  
  describe "GET 'index'" do
    it "should redirect_to login" do
      get 'index'
      response.should redirect_to('/users/sign_in')
    end
  end

end
