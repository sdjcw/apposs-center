class MachinesController < BaseController

  def index
    machines = current_app.machines.paginate(:per_page => params[:limit].to_i, :page => params[:page].to_i)
    total = current_app.machines.count

    respond_with :totalCount => total, :machines => machines
  end

  def command_state
    machine_id = params[:id]
    operations = Machine.find(machine_id).operations_on_current_app.collect do |o|
      o.attributes.update(
          "leaf" => true,
          "state" => o.human_state_name,
          "name" => o.command_name
      )
    end
    respond_with operations
  end

end
