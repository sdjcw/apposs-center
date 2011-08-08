/**
 * Created by JetBrains RubyMine.
 * User: liupengtao.pt
 * Date: 11-7-25
 * Time: 下午4:38
 * To change this template use File | Settings | File Templates.
 */
//The Welcome bar in the top
Ext.onReady(function() {
    var welcomePanel = {
        region:'north',
        contentEl:'north',
        frame:true
    };

    var adminMenus = [];

    function addAdminMenu(id, text, leaf) {
        adminMenus[adminMenus.length] = {
            id:id,
            text:text,
            leaf:leaf
        };
    }

    addAdminMenu(0, '用户信息管理', true);
    addAdminMenu(1, '角色管理', true);
    addAdminMenu(2, '命令管理', true);
    addAdminMenu(3, '命令组管理', true);
    addAdminMenu(4, '应用管理', true);
    addAdminMenu(5, '机房管理', true);
    addAdminMenu(6, '机器管理', true);

    //管理菜单树
    var adminMenuTreeStore = Ext.create('Ext.data.TreeStore', {
        root:{
            expanded:true,
            children:adminMenus
        }
    });
    var adminMenuTreePanel = Ext.create('Ext.tree.Panel', {
        title:'管理菜单',
        region:'west',
        bodyCls:'admin_nav_menu',
        rootVisible:false,
        split:true,
        collapsible:true,
        width:220,
        store:adminMenuTreeStore
    });


    //用户信息管理面板
    var userInfoPanel = {
        id:'0',
        title:'用户信息管理'
    };
    //角色管理面板
    var rolePanel = {
        id:'1',
        frame:true,
        title:'角色管理',
        layout:'border',
        split:true,
        bodyPadding:5,
        fieldDefaults: {
            labelAlign: 'left',
            msgTarget: 'side'
        },
        items: [
            {
                xtype:'gridpanel',
                title:'当前系统所有角色',
                store:roleGridStore,
                region:'center',
                columnLines:true,
                viewConfig: {
                    stripeRows: true
                },
                selType: 'rowmodel',
                plugins: [
                    rolePanelRowEditing
                ],
                columns:[
                    {
                        text:'角色名',
                        dataIndex:'name',
                        flex:1,
                        editor: {
                            xtype: 'textfield',
                            allowBlank: false
                        }
                    },
                    {
                        flex:1,
                        xtype: 'actioncolumn',
                        items: [
                            {
                                icon   : '/images/delete.gif',
                                tooltip: '删除当前角色',
                                handler: function(grid, rowIndex, colIndex) {
                                    var r = roleGridStore.getAt(rowIndex);
                                    Ext.Ajax.request({
                                        url:'/admin/roles/' + r.get('id'),
                                        method:'DELETE',
                                        params:{
                                            authenticity_token:$('meta[name="csrf-token"]').attr('content')
                                        },
                                        callback:function (options, success, response) {

                                        }
                                    });
                                    roleGridStore.remove(r);
                                    roleGridStore.load();
                                }
                            }
                        ]
                    }
                ],
                tbar: [
                    {
                        text: '增加角色',
                        iconCls:'add',
                        handler : function() {
                            var addRoleWin = Ext.create('Ext.Window', {
                                title:'增加角色',
                                layout:'border',
                                width:300,
                                height:150,
                                items:[
                                    Ext.create('Ext.form.Panel', {
                                        region:'center',
                                        frame:'true',
                                        url:'/admin/roles',
                                        defaultType:'textfield',
                                        defaults: {
                                            labelWidth:90,
                                            anchor:'95%'
                                        },
                                        items:[
                                            {
                                                xtype:'hidden',
                                                name:'authenticity_token',
                                                value:$('meta[name="csrf-token"]').attr('content')
                                            },
                                            {
                                                fieldLabel:'角色名',
                                                name:'role[name]',
                                                allowBlank:false,
                                                blankText:'角色名不能为空'
                                            }
                                        ],
                                        buttons:[
                                            {
                                                text:'保存',
                                                handler:function() {
                                                    var form = this.up('form').getForm();
                                                    if (form.isValid()) {
                                                        form.submit({
                                                            success: function(form, action) {
                                                                roleGridStore.load();
                                                                addRoleWin.close();
                                                            },
                                                            failure: function(form, action) {
                                                                roleGridStore.load();
                                                                addRoleWin.close();
                                                            }
                                                        });
                                                    }
                                                }
                                            },
                                            {
                                                text:'重设',
                                                handler:function() {
                                                    this.up('form').getForm().reset();
                                                }
                                            }
                                        ]
                                    })
                                ]
                            });
                            addRoleWin.show();
                        }
                    }
//                    {
//                        iconCls:'delete',
//                        disabled:true
//                    },
//                    {
//                        boxLabel:'删除机房时同时删除其下的所有机器',
//                        xtype:'checkbox',
//                        id:'cascadeMachine'
//                    }
                ],
                bbar: Ext.create('Ext.PagingToolbar', {
                    store: roleGridStore,
                    displayInfo: true
                }),
                listeners: {
                    edit:function(editor, e) {
                        editor.record.commit();
                        var record = editor.record;
                        Ext.Ajax.request({
                            url:'/admin/roles/' + record.get('id'),
                            method:'PUT',
                            params:{
                                authenticity_token:$('meta[name="csrf-token"]').attr('content'),
                                'role[name]':record.get('name')
                            },
                            callback:function(options, success, response) {

                            }
                        });
                    }
                }
            }
        ]
    };

    //命令管理面板
    var cmdDefPanel = Ext.create('Ext.form.Panel', {
        frame:true,
        id:'2',
        title:'命令管理',
        bodyPadding:5,
        layout:'border',
        split:true,
        fieldDefaults: {
            labelAlign: 'left',
            msgTarget: 'side'
        },
        items: [
            {
                region:'center',
                xtype: 'gridpanel',
                title:'当前系统所有命令',
                store:cmdDefGridStore,
                split:true,
                columnLines:true,
                viewConfig: {
                    stripeRows: true
                },
                selType: 'rowmodel',
                plugins: [
                    cmdDefPanelRowEditing
                ],
                columns:[
                    {
                        text:'命令名',
                        dataIndex:'name',
                        flex:6,
                        editor: {
                            xtype: 'textfield',
                            allowBlank: false
                        }
                    },
                    {
                        text:'别名',
                        dataIndex:'alias',
                        flex:6,
                        editor: {
                            xtype:'textfield'
                        }
                    },
                    {
                        text:'参数1',
                        dataIndex:'arg1',
                        flex:2,
                        editor: {
                            xtype:'textfield'
                        }
                    },
                    {
                        text:'参数2',
                        dataIndex:'arg2',
                        flex:2,
                        editor: {
                            xtype:'textfield'
                        }
                    },
                    {
                        text:'参数3',
                        dataIndex:'arg3',
                        flex:2,
                        editor: {
                            xtype:'textfield'
                        }
                    },
                    {
                        text:'参数4',
                        dataIndex:'arg4',
                        flex:2,
                        editor: {
                            xtype:'textfield'
                        }
                    },
                    {
                        text:'参数5',
                        dataIndex:'arg5',
                        flex:2,
                        editor: {
                            xtype:'textfield'
                        }
                    },
                    {
                        text:'命令组',
                        dataIndex:'cmd_group_id',
                        flex:4,
                        editor: {
                            xtype:'combo',
                            name:'cmd_group_id',
                            valueField:'id',
                            displayField:'name',
                            store:editCmdDefCmdGroupComboStore,
                            editable:false
                        },
                        renderer:cmdGroupRender
                    },
                    {
                        flex:1,
                        xtype: 'actioncolumn',
                        items: [
                            {
                                icon   : '/images/delete.gif',
                                tooltip: '删除当前命令',
                                handler: function(grid, rowIndex, colIndex) {
                                    var r = cmdDefGridStore.getAt(rowIndex);
                                    Ext.Ajax.request({
                                        url:'/admin/cmd_defs/' + r.get('id'),
                                        method:'DELETE',
                                        params:{
                                            authenticity_token:$('meta[name="csrf-token"]').attr('content')
                                        },
                                        callback:function (options, success, response) {

                                        }
                                    });
                                    cmdDefGridStore.remove(r);
                                    cmdDefGridStore.reload();
                                }
                            }
                        ]
                    }
                ],
                tbar: [
                    {
                        text: '增加命令',
                        iconCls:'add',
                        handler : function() {
                            var addCmdDefWin = Ext.create('Ext.Window', {
                                title:'增加命令',
                                layout:'border',
                                width:500,
                                items:[
                                    Ext.create('Ext.form.Panel', {
                                        region:'center',
                                        frame:'true',
                                        url:'/admin/cmd_defs',
                                        defaultType:'textfield',
                                        defaults: {
                                            labelWidth:90,
                                            anchor:'95%'
                                        },
                                        items:[
                                            {
                                                xtype:'hidden',
                                                name:'authenticity_token',
                                                value:$('meta[name="csrf-token"]').attr('content')
                                            },
                                            {
                                                fieldLabel:'命令名',
                                                name:'cmd_def[name]',
                                                allowBlank:false,
                                                blankText:'命令名不能为空'
                                            },
                                            {
                                                fieldLabel:'别名',
                                                name:'cmd_def[alias]'
                                            },
                                            {
                                                fieldLabel:'参数1',
                                                name:'cmd_def[arg1]'
                                            },
                                            {
                                                fieldLabel:'参数2',
                                                name:'cmd_def[arg2]'
                                            },
                                            {
                                                fieldLabel:'参数3',
                                                name:'cmd_def[arg3]'
                                            },
                                            {
                                                fieldLabel:'参数4',
                                                name:'cmd_def[arg4]'
                                            },
                                            {
                                                fieldLabel:'参数5',
                                                name:'cmd_def[arg5]'
                                            },
                                            {
                                                fieldLabel:'命令组',
                                                xtype:'combo',
                                                name:'cmd_def[cmd_group_id]',
                                                valueField:'id',
                                                displayField:'name',
                                                store:addCmdDefCmdGroupComboStore,
                                                editable:false
                                            }
                                        ],
                                        buttons:[
                                            {
                                                text:'保存',
                                                handler:function() {
                                                    var form = this.up('form').getForm();
                                                    if (form.isValid()) {
                                                        form.submit({
                                                            success: function(form, action) {
                                                                cmdDefGridStore.load();
                                                                addCmdDefWin.close();
                                                            },
                                                            failure: function(form, action) {
                                                                cmdDefGridStore.load();
                                                                addCmdDefCmdGroupComboStore.load();
                                                                addCmdDefWin.close();
                                                            }
                                                        });
                                                    }
                                                }
                                            },
                                            {
                                                text:'重设',
                                                handler:function() {
                                                    this.up('form').getForm().reset();
                                                }
                                            }
                                        ]
                                    })
                                ]
                            });
                            addCmdDefWin.show();
                        }
                    }
                ],
                bbar: Ext.create('Ext.PagingToolbar', {
                    store: cmdDefGridStore,
                    displayInfo: true
                }),
                listeners: {
                    edit:function(editor, e) {
                        editor.record.commit();
                        var record = editor.record;
                        Ext.Ajax.request({
                            url:'/admin/cmd_defs/' + record.get('id'),
                            method:'PUT',
                            params:{
                                authenticity_token:$('meta[name="csrf-token"]').attr('content'),
                                'cmd_def[name]':record.get('name'),
                                'cmd_def[alias]':record.get('alias'),
                                'cmd_def[arg1]':record.get('arg1'),
                                'cmd_def[arg2]':record.get('arg2'),
                                'cmd_def[arg3]':record.get('arg3'),
                                'cmd_def[arg4]':record.get('arg4'),
                                'cmd_def[arg5]':record.get('arg5'),
                                'cmd_def[cmd_group_id]':record.get('cmd_group_id')
                            },
                            callback:function(options, success, response) {

                            }
                        });
                    }
                }
            }
        ]
    });
    //命令组管理面板
    var cmdGroupDefPanel = {
        frame:true,
        id:'3',
        title:'命令组管理',
        bodyPadding:5,
        layout:'border',
        split:true,
        fieldDefaults: {
            labelAlign: 'left',
            msgTarget: 'side'
        },
        items: [
            {
                region:'center',
                xtype: 'gridpanel',
                title:'当前系统所有命令组',
                store:cmdGroupGridStore,
                split:true,
                columnLines:true,
                viewConfig: {
                    stripeRows: true
                },
                selType: 'rowmodel',
                plugins: [
                    cmdGroupPanelRowEditing
                ],
                columns:[
                    {
                        text:'命令组名',
                        dataIndex:'name',
                        flex:1,
                        editor: {
                            xtype: 'textfield',
                            allowBlank: false
                        }
                    },
                    {
                        flex:1,
                        xtype: 'actioncolumn',
                        items: [
                            {
                                icon   : '/images/delete.gif',
                                tooltip: '删除当前命令组',
                                handler: function(grid, rowIndex, colIndex) {
                                    var r = cmdGroupGridStore.getAt(rowIndex);
                                    var cascade = Ext.getCmp('cascade').checked;
                                    Ext.Ajax.request({
                                        url:'/admin/cmd_groups/' + r.get('id'),
                                        method:'DELETE',
                                        params:{
                                            authenticity_token:$('meta[name="csrf-token"]').attr('content'),
                                            cascade:cascade
                                        },
                                        callback:function (options, success, response) {

                                        }
                                    });
                                    cmdGroupGridStore.remove(r);
                                    cmdGroupGridStore.load();
                                }
                            }
                        ]
                    }
                ],
                bbar: Ext.create('Ext.PagingToolbar', {
                    store: cmdGroupGridStore,
                    displayInfo: true
                }),
                tbar: [
                    {
                        text: '增加命令组',
                        iconCls:'add',
                        handler : function() {
                            var addCmdGroupWin = Ext.create('Ext.Window', {
                                title:'增加命令组',
                                layout:'border',
                                width:300,
                                height:150,
                                items:[
                                    Ext.create('Ext.form.Panel', {
                                        region:'center',
                                        frame:'true',
                                        url:'/admin/cmd_groups',
                                        defaultType:'textfield',
                                        defaults: {
                                            labelWidth:90,
                                            anchor:'95%'
                                        },
                                        items:[
                                            {
                                                xtype:'hidden',
                                                name:'authenticity_token',
                                                value:$('meta[name="csrf-token"]').attr('content')
                                            },
                                            {
                                                fieldLabel:'命令组名',
                                                name:'cmd_group[name]',
                                                allowBlank:false,
                                                blankText:'命令组名不能为空'
                                            }
                                        ],
                                        buttons:[
                                            {
                                                text:'保存',
                                                handler:function() {
                                                    var form = this.up('form').getForm();
                                                    if (form.isValid()) {
                                                        form.submit({
                                                            success: function(form, action) {
                                                                cmdGroupGridStore.load();
                                                                editCmdDefCmdGroupComboStore.load();
                                                                addCmdGroupWin.close();
                                                            },
                                                            failure: function(form, action) {
                                                                cmdGroupGridStore.load();
                                                                editCmdDefCmdGroupComboStore.load();
                                                                addCmdGroupWin.close();
                                                            }
                                                        });
                                                    }
                                                }
                                            },
                                            {
                                                text:'重设',
                                                handler:function() {
                                                    this.up('form').getForm().reset();
                                                }
                                            }
                                        ]
                                    })
                                ]
                            });
                            addCmdGroupWin.show();
                        }
                    },
                    {
                        iconCls:'delete',
                        disabled:true
                    },
                    {
                        boxLabel:'删除命令组时同时删除其下的所有命令',
                        xtype:'checkbox',
                        id:'cascade'
                    }
                ],
                listeners: {
                    edit:function(editor, e) {
                        editor.record.commit();
                        var record = editor.record;
                        Ext.Ajax.request({
                            url:'/admin/cmd_groups/' + record.get('id'),
                            method:'PUT',
                            params:{
                                authenticity_token:$('meta[name="csrf-token"]').attr('content'),
                                'cmd_group[name]':record.get('name')
                            },
                            callback:function(options, success, response) {

                            }
                        });
                    }
                }
            }
        ]
    };
    //应用管理面板
    var appPanel = {
        id:'4',
        title:'应用管理'
    };
    //机房管理面板
    var roomPanel = {
        id:'5',
        title:'机房管理',
        frame:true,
        bodyPadding:5,
        layout:'border',
        split:true,
        fieldDefaults: {
            labelAlign: 'left',
            msgTarget: 'side'
        },
        items: [
            {
                region:'center',
                xtype: 'gridpanel',
                title:'当前系统所有机房',
                store:roomGridStore,
                split:true,
                columnLines:true,
                viewConfig: {
                    stripeRows: true
                },
                selType: 'rowmodel',
                plugins: [
                    roomPanelRowEditing
                ],
                columns:[
                    {
                        text:'机房名',
                        dataIndex:'name',
                        flex:1,
                        editor: {
                            xtype: 'textfield',
                            allowBlank: false
                        }
                    },
                    {
                        flex:1,
                        xtype: 'actioncolumn',
                        items: [
                            {
                                icon   : '/images/delete.gif',
                                tooltip: '删除当前机房',
                                handler: function(grid, rowIndex, colIndex) {
                                    var r = roomGridStore.getAt(rowIndex);
                                    var cascade = Ext.getCmp('cascadeMachine').checked;
                                    Ext.Ajax.request({
                                        url:'/admin/rooms/' + r.get('id'),
                                        method:'DELETE',
                                        params:{
                                            authenticity_token:$('meta[name="csrf-token"]').attr('content'),
                                            cascade:cascade
                                        },
                                        callback:function (options, success, response) {

                                        }
                                    });
                                    roomGridStore.remove(r);
                                    roomGridStore.load();
                                }
                            }
                        ]
                    }
                ],
                tbar: [
                    {
                        text: '增加机房',
                        iconCls:'add',
                        handler : function() {
                            var addRoomWin = Ext.create('Ext.Window', {
                                title:'增加机房',
                                layout:'border',
                                width:300,
                                height:150,
                                items:[
                                    Ext.create('Ext.form.Panel', {
                                        region:'center',
                                        frame:'true',
                                        url:'/admin/rooms',
                                        defaultType:'textfield',
                                        defaults: {
                                            labelWidth:90,
                                            anchor:'95%'
                                        },
                                        items:[
                                            {
                                                xtype:'hidden',
                                                name:'authenticity_token',
                                                value:$('meta[name="csrf-token"]').attr('content')
                                            },
                                            {
                                                fieldLabel:'机房名',
                                                name:'room[name]',
                                                allowBlank:false,
                                                blankText:'机房名不能为空'
                                            }
                                        ],
                                        buttons:[
                                            {
                                                text:'保存',
                                                handler:function() {
                                                    var form = this.up('form').getForm();
                                                    if (form.isValid()) {
                                                        form.submit({
                                                            success: function(form, action) {
                                                                roomGridStore.load();
                                                                editMachineRoomComboStore.load();
                                                                addRoomWin.close();
                                                            },
                                                            failure: function(form, action) {
                                                                roomGridStore.load();
                                                                editMachineRoomComboStore.load();
                                                                addRoomWin.close();
                                                            }
                                                        });
                                                    }
                                                }
                                            },
                                            {
                                                text:'重设',
                                                handler:function() {
                                                    this.up('form').getForm().reset();
                                                }
                                            }
                                        ]
                                    })
                                ]
                            });
                            addRoomWin.show();
                        }
                    },
                    {
                        iconCls:'delete',
                        disabled:true
                    },
                    {
                        boxLabel:'删除机房时同时删除其下的所有机器',
                        xtype:'checkbox',
                        id:'cascadeMachine'
                    }
                ],
                bbar: Ext.create('Ext.PagingToolbar', {
                    store: roomGridStore,
                    displayInfo: true
                }),
                listeners: {
                    edit:function(editor, e) {
                        editor.record.commit();
                        var record = editor.record;
                        Ext.Ajax.request({
                            url:'/admin/rooms/' + record.get('id'),
                            method:'PUT',
                            params:{
                                authenticity_token:$('meta[name="csrf-token"]').attr('content'),
                                'room[name]':record.get('name')
                            },
                            callback:function(options, success, response) {

                            }
                        });
                    }
                }
            }
        ]
    };
    //机器管理面板
    var machinePanel = {
        id: '6',
        title:'机器管理',
        frame:true,
        bodyPadding:5,
        layout:'border',
        split:true,
        fieldDefaults: {
            labelAlign: 'left',
            msgTarget: 'side'
        },
        items: [
            {
                region:'center',
                xtype: 'gridpanel',
                title:'当前系统所有机器',
                store:machineGridStore,
                split:true,
                columnLines:true,
                viewConfig: {
                    stripeRows: true
                },
                selType: 'rowmodel',
                plugins: [
                    machinePanelRowEditing
                ],
                columns:[
                    {
                        text:'机器名',
                        dataIndex:'name',
                        flex:6,
                        editor: {
                            xtype: 'textfield',
                            allowBlank: false
                        }
                    },
                    {
                        text:'主机名',
                        dataIndex:'host',
                        flex:6,
                        editor: {
                            xtype:'textfield'
                        }
                    },
                    {
                        text:'机房',
                        dataIndex:'room_id',
                        flex:4,
                        editor: {
                            xtype:'combo',
                            name:'room_id',
                            valueField:'id',
                            displayField:'name',
                            store:editMachineRoomComboStore,
//                            allowBlank: false,
                            editable:false
                        },
                        renderer:roomRender
                    },
                    {
                        text:'应用',
                        dataIndex:'app_id',
                        flex:4,
                        editor: {
                            xtype:'combo',
                            name:'app_id',
                            valueField:'id',
                            displayField:'name',
                            store:editMachineAppComboStore,
//                            allowBlank: false,
                            editable:false
                        },
                        renderer:appRender
                    },
                    {
                        flex:1,
                        xtype: 'actioncolumn',
                        items: [
                            {
                                icon   : '/images/delete.gif',
                                tooltip: '删除当前机器',
                                handler: function(grid, rowIndex, colIndex) {
                                    var r = machineGridStore.getAt(rowIndex);
                                    Ext.Ajax.request({
                                        url:'/admin/machines/' + r.get('id'),
                                        method:'DELETE',
                                        params:{
                                            authenticity_token:$('meta[name="csrf-token"]').attr('content')
                                        },
                                        callback:function (options, success, response) {

                                        }
                                    });
                                    machineGridStore.remove(r);
                                    machineGridStore.reload();
                                }
                            }
                        ]
                    }
                ],
                tbar: [
                    {
                        text: '增加机器',
                        iconCls:'add',
                        handler : function() {
                            var addMachineWin = Ext.create('Ext.Window', {
                                title:'增加机器',
                                layout:'border',
                                width:500,
                                items:[
                                    Ext.create('Ext.form.Panel', {
                                        region:'center',
                                        frame:'true',
                                        url:'/admin/machines',
                                        defaultType:'textfield',
                                        defaults: {
                                            labelWidth:90,
                                            anchor:'95%'
                                        },
                                        items:[
                                            {
                                                xtype:'hidden',
                                                name:'authenticity_token',
                                                value:$('meta[name="csrf-token"]').attr('content')
                                            },
                                            {
                                                fieldLabel:'机器名',
                                                name:'machine[name]',
                                                allowBlank:false,
                                                blankText:'机器名不能为空'
                                            },
                                            {
                                                fieldLabel:'主机名',
                                                name:'machine[host]'
                                            },
                                            {
                                                fieldLabel:'机房',
                                                xtype:'combo',
                                                name:'machine[room_id]',
                                                valueField:'id',
                                                displayField:'name',
                                                store:addMachineRoomComboStore,
                                                editable:false
                                            },
                                            {
                                                fieldLabel:'应用',
                                                xtype:'combo',
                                                name:'machine[app_id]',
                                                valueField:'id',
                                                displayField:'name',
                                                store:addMachineAppComboStore,
                                                editable:false
                                            }
                                        ],
                                        buttons:[
                                            {
                                                text:'保存',
                                                handler:function() {
                                                    var form = this.up('form').getForm();
                                                    if (form.isValid()) {
                                                        form.submit({
                                                            success: function(form, action) {
                                                                machineGridStore.load();
                                                                addMachineRoomComboStore.load();
                                                                addMachineAppComboStore.load();
                                                                addMachineWin.close();
                                                            },
                                                            failure: function(form, action) {
                                                                machineGridStore.load();
                                                                addMachineRoomComboStore.load();
                                                                addMachineAppComboStore.load();
                                                                addMachineWin.close();
                                                            }
                                                        });
                                                    }
                                                }
                                            },
                                            {
                                                text:'重设',
                                                handler:function() {
                                                    this.up('form').getForm().reset();
                                                }
                                            }
                                        ]
                                    })
                                ]
                            });
                            addMachineWin.show();
                        }
                    }
                ],
                bbar: Ext.create('Ext.PagingToolbar', {
                    store: machineGridStore,
                    displayInfo: true
                }),
                listeners: {
                    edit:function(editor, e) {
                        editor.record.commit();
                        var record = editor.record;
                        Ext.Ajax.request({
                            url:'/admin/machines/' + record.get('id'),
                            method:'PUT',
                            params:{
                                authenticity_token:$('meta[name="csrf-token"]').attr('content'),
                                'machine[name]':record.get('name'),
                                'machine[host]':record.get('host'),
                                'machine[room_id]':record.get('room_id'),
                                'machine[app_id]':record.get('app_id')
                            },
                            callback:function(options, success, response) {

                            }
                        });
                    }
                }
            }
        ]
    };

    //管理操作区
    var adminOperationPanel = Ext.create('Ext.panel.Panel', {
        region: 'center',
        layout: 'card',
        activeItem: 0,
        border:false,
        items:[
            userInfoPanel,
            rolePanel,
            cmdDefPanel,
            cmdGroupDefPanel,
            appPanel,
            roomPanel,
            machinePanel
        ]
    });

    adminMenuTreePanel.getSelectionModel().on('select', function(selModel, record) {
        adminOperationPanel.layout.setActiveItem(record.get('id'));
        if (record.get('id') == 2) {
            editCmdDefCmdGroupComboStore.load();
            cmdDefGridStore.load();
        }
        if (record.get('id') == 6) {
            editMachineRoomComboStore.load();
            editMachineAppComboStore.load();
            machineGridStore.load();
        }
    });

    Ext.create('Ext.Viewport', {
        layout: {
            type: 'border',
            padding: 5
        },
        defaults: {
            split:true
        },
        items: [
            welcomePanel,
            adminMenuTreePanel,
            adminOperationPanel
        ]
    });
});
