<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" doctype-system="about:legacy-compat"/>
  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="atom:feed/atom:title"/></title>
        <style>
          :root{color-scheme:light dark}
          body{margin:0;font-family:system-ui,-apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif;
               background:#fafafa;color:#1f2328;line-height:1.7}
          main{max-width:680px;margin:0 auto;padding:48px 20px 64px}
          header{margin-bottom:40px;border-bottom:1px solid #e5e7eb;padding-bottom:24px}
          h1{font-size:1.6em;margin:0 0 8px}
          .sub{color:#57606a;margin:0}
          .meta{color:#8b949e;font-size:.85em;margin:12px 0 0}
          article{padding:20px 0;border-bottom:1px solid #eef0f2}
          article:last-child{border-bottom:none}
          h2{font-size:1.1em;margin:0 0 6px}
          a{color:#0969da;text-decoration:none}
          a:hover{text-decoration:underline}
          .date{color:#8b949e;font-size:.82em;margin:0 0 8px}
          .summary{color:#57606a;margin:0;font-size:.95em}
          footer{margin-top:40px;color:#8b949e;font-size:.8em}
          @media (prefers-color-scheme:dark){
            body{background:#0d1117;color:#e6edf3}
            header{border-color:#21262d}
            article{border-color:#21262d}
            .sub,.summary{color:#8b949e}
            .meta,.date{color:#6e7681}
            a{color:#58a6ff}
          }
        </style>
      </head>
      <body>
        <main>
          <header>
            <h1><xsl:value-of select="atom:feed/atom:title"/></h1>
            <p class="sub"><xsl:value-of select="atom:feed/atom:subtitle"/></p>
            <p class="meta">订阅源 · 共 <xsl:value-of select="count(atom:feed/atom:entry)"/> 篇</p>
          </header>
          <xsl:for-each select="atom:feed/atom:entry">
            <article>
              <h2>
                <a href="{atom:link[not(@rel)]/@href}">
                  <xsl:value-of select="atom:title"/>
                </a>
              </h2>
              <p class="date"><xsl:value-of select="substring(atom:published,1,10)"/></p>
              <p class="summary"><xsl:value-of select="atom:summary"/></p>
            </article>
          </xsl:for-each>
          <footer><p>这是 Atom 订阅源，浏览器直接打开时的渲染效果。</p></footer>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
