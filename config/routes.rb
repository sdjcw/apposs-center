
Apposs::Application.routes.draw do

  devise_for :users

  root :to => 'home#index'

  get "home/index"

  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end

  namespace :admin, :module => "admin" do
    root :to => 'home#index'
    resources :directive_templates
    resources :directive_groups
    resources :apps do
      put :update_app_user_role, :on => :member
    end
    resources :users
    resources :roles
    resources :machines
    resources :rooms
  end

  resources :directive_groups

  resources :rooms

  resources :apps do
    resources :machines do
      member do
        get :command_state
        put :reset
      end
    end
    resources :operation_templates do
      post :group_execute, :on => :member
      post :execute, :on => :member
    end
    resources :operations do
      member do
        put :enable
      end
    end
    resources :softwares
    resources :directives do
      member do
        put :ack
      end
    end
    get :rooms, :on => :member
  end

  resources :operation_templates
  
  resources :directive_groups do
    get :items, :on => :member
  end
  
  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  # root :to => "welcome#index"

  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  match ':controller(/:action(/:id(.:format)))'
end
