<#escape x as x?html>
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="content-type" content="text/html;charset=utf-8">
    <link rel="stylesheet" type="text/css" href="http://localhost:3000"/>
    <script src="../../../webapp/lsweb/resources/js/jquery-1.8.min.js"></script>
    <style type="text/css"></style>
</head>
<body>
    姓名：${user.userName}
    年龄：${user.age}
    <ul>
        <#list itemList as item>
            ${item.name} -- ${item.price}
        </#list>
    </ul>
</body>
</html>
</#escape>
