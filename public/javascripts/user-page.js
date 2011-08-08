/**
 * Created by JetBrains RubyMine.
 * User: liupengtao.pt
 * Date: 11-7-17
 * Time: 下午6:38
 * To change this template use File | Settings | File Templates.
 */
Ext.onReady(function() {

    //准备执行命令包时，选择要执行命令的机器，发送到后台的appId与cmdSetDefId参数
    var chooseMachineToExecuteAppId = 1;
    var chooseMachineToExecuteCmdSetDefId = 1;
    //机器名
    var machineName;
    //Application Panel array
    var appPanels = [];
    var csrf_token = $('meta[name="csrf-token"]').attr('content');
    //Current User Application TabPanel
    var appTabPanel = Ext.create('Ext.tab.Panel', {
        region: 'center',
        frame:true,
        split:true
    });

    //应用的中心命令执行状态面板
    //操作模型的定义
    createModel('Command', ['id','name','state',{name:'created_at',type: 'date'}]);

    //一台机器上的所有的命令的执行状态的模型
//    createModel('MachineCommand', ['id','name','state']);

    //机器列表Model
    createModel('AppMachine', ['id','name','host','chooseToExecute']);
    //Add Current User's Application to the appPanels array.
    function addAppTabPanel(name, id) {
        //请求加载机器上的操作执行状态的队列
        var requestMachineOperationStateQueue = [];
        //当前应用的机器列表Store
        var machineStore = Ext.create('Ext.data.Store', {
            pageSize: 200,
            model:'AppMachine',
            buffered:true,
//            clearOnPageLoad:false,
            proxy:{
                type:'ajax',
                url:'/apps/' + id + '/machines',
                reader:{
                    type:'json',
                    totalProperty:'totalCount',
                    root:'machines'
                }
            }
        });
        //命令包执行前要选择执行命令包的机器Store
        var chooseMachineToExecuteStore = Ext.create('Ext.data.Store', {
            pageSize: 200,
            model:'AppMachine',
            buffered:true,
//            clearOnPageLoad:false,
            proxy:{
                type:'ajax',
                url:'/apps/' + id + '/machines',
                reader:{
                    type:'json',
                    totalProperty:'totalCount',
                    root:'machines'
                }
            }
        });
        //应用的左侧面板
        var appLeftPanel = {
            layout:'vbox',
            autoScroll:true,
            collapsible:true,
            split:true,
            region:'west',
            items:[
                {
                    title:'机器列表',
                    width:450,
                    flex:1,
                    frame:true,
                    layout:'border',
                    items:[
                        {
                            xtype:'gridpanel',
                            id:'machines' + id,
                            split:true,
                            columnLines:true,
                            verticalScrollerType: 'paginggridscroller',
                            invalidateScrollerOnRefresh: false,
                            region:'center',
//                            selModel:Ext.create('Ext.selection.CheckboxModel'),
                            viewConfig: {
                                stripeRows: true
                            },
                            store:machineStore,
                            columns:[
                                {
                                    xtype: 'rownumberer',
                                    width: 50,
                                    sortable: false
                                },
                                {
                                    header:'机器名',
                                    dataIndex:'name',
                                    flex:1
                                },
                                {
                                    header:'主机',
                                    dataIndex:'host',
                                    flex:1
                                }
                            ],
                            listeners:{
                                selectionchange:function(view, selections) {
                                    if (Ext.getCmp('centerCardPanel' + id).layout.getActiveItem() == appMachineCommandStateTreePanel) {
                                        var machine = selections[0];
                                        if (machine) {
                                            requestMachineOperationStateQueue.push(machine);
                                            if (requestMachineOperationStateQueue.length == 1) {
                                                requestMachineOperationStateQueue.shift();
                                                appMachineCommandStateTreePanel.setTitle("当前应用的" + machine.get('name') + "机器上的命令执行状态");
                                                machineCommandStore.proxy.url = '/apps/' + id + '/machines/' + machine.get('id') + '/command_state'
                                                machineCommandStore.load();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title:'命令包',
                    flex:1,
                    width:450,
                    id:'commands' + id,
                    layout:'anchor',
                    frame:true,
                    autoScroll:true,
                    tbar:[
                        {
                            xtype:'button',
                            text:'刷新',
                            iconCls:'refresh',
                            handler:function() {
                                var cmdSetPanel = Ext.getCmp('commands' + id);
                                cmdSetPanel.removeAll();
                                loadCmdSetForApp(id);
                            }
                        }
                    ]
                }
            ],
            tbar:[
                {
                    text:'查看<span style="font-weight: bolder;color: blue;">机器</span>的命令执行状态',
                    xtype:'button',
                    iconCls:'view',
                    handler:function() {
                        Ext.getCmp('centerCardPanel' + id).layout.setActiveItem(2);
                    }
                },
                {
                    text:'查看<span style="font-weight: bolder;color: blue;">当前应用</span>的命令执行状态',
                    xtype:'button',
                    iconCls:'view',
                    handler:function() {
                        Ext.getCmp('centerCardPanel' + id).layout.setActiveItem(0);
                    }
                }
            ]
        };
        machineStore.guaranteeRange(0, 199);
        chooseMachineToExecuteStore.guaranteeRange(0, 199);

        //操作数据store的获取
        var commandStore = Ext.create('Ext.data.TreeStore', {
            model:Command,
            storeId:'commandStore' + id,
            proxy:{
                type:'ajax',
                url:'/apps/' + id + '/cmd_sets',
                reader:{
                    type:'json'
                }
            },
            nodeParam:'key',
            autoLoad:true,
            root:{
                text:'命令',
                id:'root',
                expanded:true
            }
        });

        //机器的命令执行状态Tree的Store
        var machineCommandStore = Ext.create('Ext.data.TreeStore', {
            //model:MachineCommand,
            model:Command,
            storeId:'machineCommandStore' + id,
            proxy:{
                type:'ajax',
                url:'',
                reader:{
                    type:'json'
                }
            },
            nodeParam:'key',
            root:{
                text:'命令',
                id:'root',
                expanded:true
            }
        });

        //应用的命令执行状态树结构
        var appCenterPanel = Ext.create('Ext.tree.Panel', {
            store:commandStore,
            frame:true,
            title:'当前应用的命令执行状态',
            rootVisible:false,
            autoScroll:true,
            loadMask:true,
            columns: [
                {
                    xtype:'treecolumn',
                    header:'命令名',
                    dataIndex:'name',
                    flex:1
                },
                {
                    header:'命令执行状态',
                    dataIndex:'state',
                    flex:1
                },
                {
                    header:'创建时间',
                    dataIndex:'created_at',
                    renderer : Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
                    flex:1
                },
                {
                    header:'开始执行时间',
                    dataIndex:'execute_at',
                    flex:1
                }
            ],
            dockedItems: [
                {
                    xtype: 'toolbar',
                    dock: 'top',
                    items: [
                        {
                            xtype: 'button',
                            text: '<span style="font-size: 14px;">刷新</span>',
                            iconCls:'refresh',
                            handler:function() {
                                Ext.data.StoreManager.lookup('commandStore' + id).load();
                            }
                        }
                    ]
                }
            ]
        });

        //当前应用的单台机器上的命令执行状态树结构
        var appMachineCommandStateTreePanel = Ext.create('Ext.tree.Panel', {
            store:machineCommandStore,
            frame:true,
            title:'',
            rootVisible:false,
            autoScroll:true,
            loadMask:true,
            columns: [
                {
                    xtype:'treecolumn',
                    header:'命令名',
                    dataIndex:'name',
                    flex:1
                },
                {
                    header:'命令执行状态',
                    dataIndex:'state',
                    flex:1
                },
                {
                    header:'创建时间',
                    dataIndex:'created_at',
                    renderer : Ext.util.Format.dateRenderer('Y-m-d H:i:s'),
                    flex:1
                },
                {
                    header:'开始执行时间',
                    dataIndex:'execute_at',
                    flex:1
                }
            ],
            dockedItems: [
                {
                    xtype: 'toolbar',
                    dock: 'top',
                    items: [
                        {
                            xtype: 'button',
                            text: '<span style="font-size: 14px;">刷新</span>',
                            iconCls:'refresh',
                            handler:function() {
                                Ext.data.StoreManager.lookup('machineCommandStore' + id).load();
                            }
                        }
                    ]
                }
            ],
            listeners:{
                itemappend:function() {
                    machine = requestMachineOperationStateQueue.shift();
                    if (machine) {
                        appMachineCommandStateTreePanel.setTitle("当前应用的" + machine.get('name') + "机器上的命令执行状态");
                        machineCommandStore.proxy.url = '/apps/' + id + '/machines/' + machine.get('id') + '/command_state'
                        machineCommandStore.load();
                    }
                }
            }
        });

        //执行命令包前选择将要执行该命令包的机器Panel
        var chooseMachinesToExecutePanel = Ext.create('Ext.grid.Panel', {
            title:'选择执行命令包的机器',
            split:true,
            columnLines:true,
            disableSelection: true,
            verticalScrollerType: 'paginggridscroller',
            invalidateScrollerOnRefresh: false,
            region:'center',
            viewConfig: {
                stripeRows: true
            },
            store:chooseMachineToExecuteStore,
            columns:[
                {
                    xtype: 'rownumberer',
                    width: 50,
                    sortable: false
                },
                {
                    header:'机器名',
                    dataIndex:'name',
                    flex:1
                },
                {
                    header:'主机',
                    dataIndex:'host',
                    flex:1
                },
                {
                    xtype: 'checkcolumn',
                    text: '在当前机器执行',
                    dataIndex: 'chooseToExecute',
                    flex:1
                }
            ],
            tbar:[
                {
                    xtype:'button',
                    iconCls:'execute',
                    text:'执行',
                    handler:function() {
                        var choosedMachines = [];
                        chooseMachineToExecuteStore.each(function(record) {
                            if (record.get('chooseToExecute') == true) {
                                choosedMachines.push(record.get('id'));
                            }
                        });
                        Ext.Ajax.request({
                            url:'apps/' + id + '/cmd_sets',
                            method:'POST',
                            params:{
                                authenticity_token:csrf_token,
                                cmd_set_def_id:chooseMachineToExecuteCmdSetDefId,
                                choosedMachines:choosedMachines.join(',')
                            },
                            callback:function(options, success, response) {
                                Ext.Msg.alert('消息', response.responseText);
                                Ext.getCmp('centerCardPanel' + id).layout.setActiveItem(0);
                            }
                        });
                    }
                },
                {
                    xtype:'button',
                    iconCls:'clear',
                    text:'清空所选择的机器',
                    handler:function() {
                        chooseMachineToExecuteStore.each(function(record) {
                            record.set('chooseToExecute', false);
                        });
                    }
                }
            ]
        });
        //用户界面的中心card面板
        var centerCardPanel = Ext.create('Ext.panel.Panel', {
            layout:'card',
            region:'center',
            border:false,
            id:'centerCardPanel' + id,
            activeItem:0,
            items:[
                appCenterPanel,
                chooseMachinesToExecutePanel,
                appMachineCommandStateTreePanel
            ]
        });
        //一个应用的总面板
        var appPanel = {
            title:name,
            xtype:'panel',
            layout:'border',
            split:true,
            collapsible:true,
            items:[
                appLeftPanel,
                centerCardPanel
            ]
        };
        appPanels[appPanels.length] = appPanel;
    }

    //分组Store
    var groupStore = Ext.create('Ext.data.Store', {
        fields:['group_count'],
        data:[
            {
                'group_count':1
            },
            {
                'group_count':2
            },
            {
                'group_count':3
            },
            {
                'group_count':4
            },
            {
                'group_count':5
            },
            {
                'group_count':6
            }
        ]
    });
    //为应用加载命令包
    function loadCmdSetForApp(appId) {
        Ext.Ajax.request({
            url:'/apps/' + appId + '/cmd_set_defs',
            callback:function(options, success, response) {
                var cmdSetStr = response.responseText;
                var cmdSet = Ext.decode(cmdSetStr);
                var cmdSetPanel = [];
                for (var j = 0,len = cmdSet.length; j < len; j++) {
                    var columnCount = cmdSet[j].actions.length + 1;
                    var cmdSetPanelCmps = [];
                    cmdSetPanelCmps[cmdSetPanelCmps.length] = {
                        xtype:'label',
                        flex:cmdSet[j].flex,
                        html:cmdSet[j].name
                    };
                    for (var k = 1; k < columnCount; k++) {
                        cmdSetPanelCmps[cmdSetPanelCmps.length] = {
                            flex:cmdSet[j].actions[k - 1].flex,
                            xtype:'button',
                            text:cmdSet[j].actions[k - 1].name,
                            handler:
                                (function(url, method, type, cmdSetDefId) {
                                    return function() {
                                        if (type.toLowerCase() == 'simple') {
                                            chooseMachineToExecuteAppId = appId;
                                            chooseMachineToExecuteCmdSetDefId = cmdSetDefId;
                                            var executeCommandWin = Ext.create('Ext.Window', {
                                                title:'选择执行方式',
                                                width:300,
                                                height:160,
                                                layout:'border',
                                                items:[
                                                    {
                                                        xtype:'fieldset',
                                                        region:'center',
                                                        frame:true,
                                                        items:[
                                                            {
                                                                xtype: 'radiogroup',
                                                                columns: 2,
                                                                margin:'10 0 0 0',
                                                                id:'execute_strategy',
                                                                items: [
                                                                    {
                                                                        name:'execute_strategy',
                                                                        boxLabel:'顺序执行',
                                                                        inputValue:1,
                                                                        checked:true,
                                                                        listeners:{
                                                                            change:function(field, newValue, oldValue) {
                                                                                if (newValue == true) {
                                                                                    Ext.getCmp('groupCount').hide();
                                                                                }
                                                                            }
                                                                        }

                                                                    },
                                                                    {
                                                                        name:'execute_strategy',
                                                                        boxLabel:'分组执行',
                                                                        inputValue:2,
                                                                        listeners:{
                                                                            change:function(field, newValue, oldValue) {
                                                                                if (newValue == true) {
                                                                                    Ext.getCmp('groupCount').show();
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                xtype:'combo',
                                                                id:'groupCount',
                                                                fieldLabel:'请选择分组数',
                                                                queryMode: 'local',
                                                                displayField: 'group_count',
                                                                valueField: 'group_count',
                                                                store:groupStore,
                                                                value:3,
                                                                editable:false,
                                                                hidden:true
                                                            }
                                                        ]
                                                    }
                                                ],
                                                buttons:[
                                                    {
                                                        text:'确定',
                                                        handler:function() {
                                                            var fieldset = Ext.getCmp('execute_strategy');
                                                            if (fieldset.getChecked()[0].getGroupValue() == 1) {
                                                                Ext.getCmp('centerCardPanel' + appId).layout.setActiveItem(1);
                                                            }
                                                            executeCommandWin.close();
                                                        }
                                                    }
                                                ]
                                            });
                                            executeCommandWin.show();
                                            return;
                                        }
                                        Ext.Ajax.request({
                                            url:url,
                                            method:method,
                                            params:{
                                                authenticity_token:csrf_token,
                                                cmd_set_def_id:cmdSetDefId
                                            },
                                            callback:(function(type) {
                                                return function(options, success, response) {
                                                    if (type == 'simple') {
                                                        Ext.Msg.alert('消息', response.responseText);
                                                    } else if (type == 'multi') {
                                                        var respondUrl = Ext.decode(response.responseText).url;
                                                        var multiWin = Ext.create('Ext.Window', {
                                                            width:720,
                                                            height:544,
                                                            autoScroll:true,
                                                            items:[
                                                                {
                                                                    autoScroll:true,
                                                                    html:getIFrameForEditCmdSet(respondUrl, 700, 500)
                                                                }
                                                            ]
                                                        });
                                                        multiWin.show();
                                                    }
                                                    else if (type == 'delete') {
                                                        var cmdSetPanel = Ext.getCmp('commands' + appId);
                                                        cmdSetPanel.removeAll();
                                                        loadCmdSetForApp(appId);
                                                    }
                                                }
                                            })(type)
                                        })
                                    }
                                })(cmdSet[j].actions[k - 1].url, cmdSet[j].actions[k - 1].method, cmdSet[j].actions[k - 1].type, cmdSet[j].id)
                        }
                    }
                    cmdSetPanel[cmdSetPanel.length] = {
                        xtype:'panel',
                        border:false,
//                        layout:'column',
                        layout:'hbox',
                        anchor:'100%',
                        frame:true,
                        items: [
                            cmdSetPanelCmps
                        ]
                    }
                }
                //增加命令包面板
                cmdSetPanel[cmdSetPanel.length] = {
                    xtype:'panel',
                    layout:'hbox',
                    border:false,
                    anchor:'100%',
                    frame:true,
                    items:[
                        {
                            xtype:'label',
                            flex:10,
                            html:'&nbsp;'
                        },
                        {
                            xtype:'button',
                            text:'增加',
                            id:'appAddButton' + appId,
                            flex:1,
                            handler:function() {
                                addCmdSetWindow(this.id.substring(this.id.length - 1));
                            }
                        }
                    ]
                }
                Ext.getCmp('commands' + appId).add(cmdSetPanel);
            }
        });
    }

    //增加命令包窗口
    function addCmdSetWindow(appId) {
        //请求获取命令组数据并解析
        var cmdGroupNodes = [];
        Ext.Ajax.request({
            url:'/cmd_groups',
            callback:function(options, success, response) {
                var cmdGroups = Ext.decode(response.responseText);
                for (var i = 0; i < cmdGroups.length; i++) {
                    var cmdGroupNode = {};
                    var cmdGroup = cmdGroups[i];
                    cmdGroupNode.id = 'cmd_group' + cmdGroup.id;
                    cmdGroupNode.text = cmdGroup.name;

                    //为命令组增加命令
                    var cmdDefs = cmdGroup.cmd_defs;
                    if (cmdDefs.length == 0) {
                        cmdGroupNode.leaf = true;
                    } else {
                        var children = [];
                        for (var j = 0; j < cmdDefs.length; j++) {
                            var cmdDef = {};
                            cmdDef.id = 'cmd_def' + cmdDefs[j].id;
                            cmdDef.text = cmdDefs[j].name;
                            cmdDef.leaf = true;

                            children[children.length] = cmdDef;
                        }
                        cmdGroupNode.children = children;
                    }
                    cmdGroupNodes[cmdGroupNodes.length] = cmdGroupNode;
                }
                var cmdGroupStore = Ext.create('Ext.data.TreeStore', {
                    root: {
                        text: '命令组列表',
                        expanded: true,
                        children:cmdGroupNodes
                    },
                    folderSort: true,
                    sorters: [
                        {
                            property: 'id',
                            direction: 'ASC'
                        }
                    ]
                });

                //增加命令包时系统所有的命令组树

                var cmdGroupTreePanel = Ext.create('Ext.tree.Panel', {
                    title: '当前系统所有命令',
                    region:'west',
                    store:cmdGroupStore,
                    width:200,
                    autoScroll:true,
                    loadMask:true,
                    collapsible:true,
                    viewConfig: {
                        plugins: {
                            ptype: 'treeviewdragdrop',
                            enableDrop:false
                        }
                    },
                    selModel:{
                        mode:'MULTI'
                    },
                    listeners:{
                        itemremove:function(parent, node) {
                            var nextSibling = node.nextSibling;
                            var newNode = node.createNode({
                                id:node.data.id,
                                text:node.data.text,
                                leaf:node.data.leaf
                            });
                            if (!node.isLeaf()) {
                                var childNodes = node.childNodes;
                                for (var i = 0,len = childNodes.length; i < len; i++) {
                                    newNode.appendChild({
                                        id:childNodes[i].data.id,
                                        text:childNodes[i].data.text,
                                        leaf:childNodes[i].data.leaf
                                    });
                                }
                            }
                            if (nextSibling) {
                                parent.insertBefore(newNode, nextSibling);
                            } else {
                                parent.appendChild(newNode);
                            }
                            if (node.isExpanded()) {
                                newNode.expand();
                            }
                            node.remove(true);
                        }
                    }
                });
                cmdGroupTreePanel.getSelectionModel().on('select', function(selModel, record) {
                    var nodes = selModel.getSelection();
                    if (record.isLeaf() && nodes.indexOf(record.parentNode) > -1) {
                        selModel.deselect(record);
                    }
                    if (!record.isLeaf() && !record.isRoot()) {
                        record.eachChild(function(child) {
                            selModel.deselect(child);
                        });
                    }
                    if (record.isRoot()) {
                        selModel.deselect(record);
                    }
                });

                //增加命令包时点击增加时，增加命令到命令包
                function addCmdSet() {
                    var expression = '';
                    //获取命令包表达式
                    cmdSetTreePanel.getRootNode().eachChild(function(child) {
                        var data = child.data;
                        expression += data.id.substring(data.id.length - 1, data.id.length) + (data.allowFailure == true ? '|true' : '');
                        if (!child.isLast()) {
                            expression += ',';
                        }
                    });
                    //增加命令包完成后刷新用户界面中的命令包信息
                    Ext.Ajax.request({
                        url:'/apps/' + appId + '/cmd_set_defs',
                        method:'POST',
                        params:{
                            authenticity_token:csrf_token,
                            'cmd_set_def[name]':Ext.getCmp('cmdSetName').value,
                            'cmd_set_def[expression]':expression
                        },
                        callback:function(options, success, response) {
                            Ext.getCmp('savedStatus').setText('命令包增加成功');
                            var cmdSetPanel = Ext.getCmp('commands' + appId);
                            cmdSetPanel.removeAll();
                            loadCmdSetForApp(appId);
                            addCmdSetWin.close();
                        }
                    });
                }

                var cmdSetTreeStore = Ext.create('Ext.data.TreeStore', {
                    root: {
                        text: '',
                        expanded: true
                    },
                    fields:['id','text','allowFailure']
                });

                //增加命令包时向命令包中增加命令组中的命令信息,此方法被多个操作共用
                function addCmdGroupToCmdSet(parent, node, refNode) {
                    node.eachChild(function(child) {
                        var newChild = parent.createNode({
                            id:child.data.id,
                            text:child.data.text,
                            leaf:child.data.leaf
                        });
                        setTimeout(function() {
                            parent.insertBefore(newChild, refNode);
                        }, 10);
                    });
                    setTimeout(function() {
                        node.removeAll();
                        node.remove();
                    }, 10);
                }

                //增加命令包时的命令包树结构信息
                var cmdSetTreePanel = Ext.create('Ext.tree.Panel', {
                    title:'命令包所有命令',
                    collapsible:true,
                    region:'center',
                    viewConfig: {
                        plugins: {
                            ptype: 'treeviewdragdrop'
                        }
                    },
                    autoScroll:true,
                    loadMask:true,
                    listeners:{
                        //向命令包中增加命令
                        iteminsert:function(parent, node, refNode) {
                            if (!node.isLeaf()) {
                                addCmdGroupToCmdSet(parent, node, refNode);
                            }
                        },
                        itemappend:function(parent, node, index) {
                            if (!node.isLeaf()) {
                                addCmdGroupToCmdSet(parent, node);
                            }
                        }
                    },
                    tbar: [
                        {
                            xtype: 'button',
                            iconCls:'add',
                            text: '保存',
                            handler:function() {
                                var name = Ext.getCmp('cmdSetName').value;
                                if (!name || name.trim().length == 0) {
                                    Ext.Msg.alert('提醒', '请输入命令包的名字！');
                                    return;
                                }
                                cmdSetTreePanel.getRootNode().commit();
                                addCmdSet();
                                this.setDisabled(true);
                            }
                        }
                    ],
                    store:cmdSetTreeStore,
                    columns: [
                        {
                            xtype:'treecolumn',
                            text: '命令',
                            width:220,
                            dataIndex: 'text'
                        },
                        {
                            xtype:'checkcolumn',
                            text: '允许失败',
                            dataIndex: 'allowFailure'
                        },
                        {
                            xtype: 'actioncolumn',
                            width: 20,
                            items: [
                                {
                                    icon   : '/images/delete.gif',
                                    tooltip: '删除当前命令',
                                    handler: function(tree, rowIndex, colIndex) {
                                        var root = this.up('treepanel').getRootNode();
                                        if (rowIndex == 0) {
                                            root.removeAll();
                                        } else {
                                            var nodeToDeleted = root.getChildAt(rowIndex - 1);
                                            nodeToDeleted.remove();
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                });

                //增加命令包时显示命令包的信息面板，包括命令包名与树状信息
                var cmdSetPanel = Ext.create('Ext.panel.Panel', {
                    title:'命令包',
                    region:'center',
                    collapsible:true,
                    layout:'border',
                    items:[
                        {
                            layout:'column',
                            frame:true,
                            region:'north',
                            items:[
                                {
                                    xtype:'textfield',
                                    fieldLabel:'命令包名',
                                    id:'cmdSetName',
                                    columnWidth:0.5,
                                    enableKeyEvents:true,
                                    listeners:{
                                        keyup:function(field) {
                                            cmdSetTreePanel.getRootNode().set('text', field.getValue());
                                        }
                                    }
                                },
                                {
                                    xtype:'label',
                                    columnWidth:0.5,
                                    id:'savedStatus'
                                }
                            ]
                        },
                        cmdSetTreePanel
                    ]
                });
                //增加命令包的窗口
                var addCmdSetWin = Ext.create('Ext.Window', {
                    title:'增加命令包',
                    layout: {
                        type: 'border',
                        padding: 5
                    },
                    defaults: {
                        split: true
                    },
                    items: [
                        cmdGroupTreePanel,
                        cmdSetPanel
                    ],
                    width:700,
                    height:500
                });
                addCmdSetWin.show();
            }
        });
    }

    //编辑命令包时的iframe标签
    function getIFrameForEditCmdSet(url, width, height) {
        return '<iframe src="' + url + ' " width="' + width + '" height="' + height + '"' +
            '></iframe>'
    }

    //Request Current User's Applications
    Ext.Ajax.request({
        url:'/apps',
        callback:function(options, success, response) {
            var result = response.responseText;
            var obj = Ext.decode(result);
            for (var i = 0; i < obj.length; i++) {
                addAppTabPanel(obj[i].name, obj[i].id);
            }
            appTabPanel.add(appPanels);//Add to addTabPanel

            for (var i = 0; i < obj.length; i++) {
                //此处获取App的命令包列表，url为apps/:id/cmd_set_defs
                loadCmdSetForApp(obj[i].id);
            }
        }
    });

    //The Welcome bar in the top
    var welcomePanel = {
        region:'north',
        contentEl:'north',
        frame:true
    };

    //The main panel
    var userMainPanel = Ext.create('Ext.Viewport', {
        renderTo:'main',
        layout: {
            type: 'border',
            padding: 5
        },
        defaults: {
            split:true
        },
        items: [
            welcomePanel,
            appTabPanel
        ]
    });
});
