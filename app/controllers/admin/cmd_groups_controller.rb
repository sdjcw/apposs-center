class Admin::CmdGroupsController < Admin::BaseController
  def index
    respond_with CmdGroup.all
  end

  def show
    respond_with CmdGroup.find(params[:id])
  end

  def create
    respond_with CmdGroup.create( params[:cmd_group] )
  end

  def update
    respond_with CmdGroup.find( params[:id] ).update_attributes( params[:cmd_group] )
  end

  def destroy
    group = CmdGroup.find(params[:id])
    if cascade?
      group.cmd_defs.each{|cmd_def| cmd_def.delete }
    else
      group.cmd_defs.clear
    end
    respond_with group.delete
  end

  private
    def cascade?
      params[:cascade]=='true'
    end
end
