<template>
  <div class="main">
    <el-container>
      <!-- タイトル -->
      <el-header>
        <h3>ビジネスメール校正アプリ</h3>
      </el-header>

      <!-- 文章校正対象のテキストを入れる -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="4"><div class="grid-content"></div></el-col>
          <el-col :span="16" style="text-align: left">
            <p>ビジネスメールによくある間違いをチェックするアプリです</p>
            <p>
              メール本文を入力し「チェック」ボタンを押してください。ボタンの下に間違いが赤くなり表示されます。マウスオーバーでツールチップが表示されます
            </p>
            <textarea
              style="width: 100%"
              rows="30"
              v-model="userInputText"
              placeholder="メール本文を入れてください"
              autofocus
            ></textarea>
          </el-col>
          <el-col :span="4"><div class="grid-content"></div></el-col>
        </el-row>

        <!-- ボタン -->
        <el-row :gutter="20">
          <el-button type="primary" @click="proofread">チェック</el-button>
        </el-row>

        <!-- 校正後の文章を出す場所 -->
        <el-row :gutter="20">
          <el-col :span="4"><div class="grid-content"></div></el-col>
          <el-col :span="16" style="text-align: left">
            <span class="text" v-html="proofreadText"></span
          ></el-col>
          <el-col :span="4"><div class="grid-content"></div></el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script>
// 多分大丈夫だが、ユーザーからの入力文章をそのまま表示するのは危険な気がするので、HTMLをサニタイズする
import sanitizeHtml from "sanitize-html";

// ツールチップに使うライブラリ
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css"; // optional for styling

export default {
  data() {
    return {
      // ユーザーからの入力文章
      userInputText: "",
      // ユーザーからの入力文章のどこからどこまでが間違っている可能性があり、どのように間違っているかを表したリスト。
      // 実装上必要なHTMLクラス名などの情報も入っている。
      // これを元にして校正済みの文章を作る。
      fixes: [],
      // 校正済みの文章
      proofreadText: "",
      fixTemplate: [
        {
          checkExpression: "了解",
          className: "ryokai",
          fixMessage: "了解より「承知しました」の方が丁寧です",
        },
        {
          checkExpression: "お世話様です",
          className: "osewasama",
          fixMessage: "「お世話になっております」が適切ではないでしょうか？",
        },
        {
          checkExpression: "お世話さまです",
          className: "osewasama",
          fixMessage: "「お世話になっております」が適切ではないでしょうか？",
        },
        {
          checkExpression: "ご苦労さまです",
          className: "gokurousamadesu",
          fixMessage:
            "「ご苦労さまです」は目下の人に対して使う言葉です。「お疲れさまです」「お世話になっております」が適切ではないでしょうか？",
        },
        {
          checkExpression: "ご苦労様です",
          className: "gokurousamadesu",
          fixMessage:
            "「ご苦労さまです」は目下の人に対して使う言葉です。「お疲れさまです」「お世話になっております」が適切ではないでしょうか？",
        },
        {
          checkExpression: "拝見させていただきます",
          className: "haikensaseteitadakimasu",
          fixMessage:
            "「させていただきます」は相手の許可を得るときの表現です。「拝見いたします」が適切ではないでしょうか？",
        },
        {
          checkExpression: "すいません",
          className: "suimasen",
          fixMessage:
            "「すいません」は「すみません」の口語です。「ありがとうございます」もしくは「申し訳ございません」「恐れ入ります」などがより適切ではないでしょうか？",
        },
        {
          checkExpression: "役不足",
          className: "yakubusoku",
          fixMessage: "「力不足」「力量不足」ではないでしょうか？",
        },
        {
          checkExpression: "我社",
          className: "wagasya",
          fixMessage: "「弊社」「当社」がより適切ではないでしょうか？",
        },
        {
          checkExpression: "わが社",
          className: "wagasya",
          fixMessage: "「弊社」「当社」がより適切ではないでしょうか？",
        },
        {
          checkExpression: "させていただいております",
          className: "saseteitadaiteorimasu",
          fixMessage:
            "「させていただく」は相手の許可を得るときの表現です。「いたします」「しております」などがより適切ではないでしょうか？",
        },
        {
          checkExpression: "各位様",
          className: "kakuisama",
          fixMessage:
            "各位自体が皆様を表します。「〇〇各位」「お客様各位」がより適切ではないでしょうか？",
        },
        {
          checkExpression: "社長様",
          className: "titlesama",
          fixMessage:
            "役職に敬称をつけるのは誤りです。「〇〇社長」「社長の〇〇様」などとするのが良いでしょう",
        },
        {
          checkExpression: "部長様",
          className: "titlesama",
          fixMessage:
            "役職に敬称をつけるのは誤りです。「〇〇社長」「社長の〇〇様」などとするのが良いでしょう",
        },
        {
          checkExpression: "係長様",
          className: "titlesama",
          fixMessage:
            "役職に敬称をつけるのは誤りです。「〇〇社長」「社長の〇〇様」などとするのが良いでしょう",
        },
        {
          checkExpression: "課長様",
          className: "titlesama",
          fixMessage:
            "役職に敬称をつけるのは誤りです。「〇〇社長」「社長の〇〇様」などとするのが良いでしょう",
        },
        {
          checkExpression: "下さい",
          className: "kudasai",
          fixMessage:
            "「下さい」は何かをもらいたいときに使います。「ください」ではないでしょうか？",
        },
        {
          checkExpression: "頂く",
          className: "itadaku",
          fixMessage:
            "「頂く」は何かをもらうときに使います。「いただく」ではないでしょうか？",
        },
        {
          checkExpression: "申され",
          className: "mousare",
          fixMessage:
            "「申す」は謙譲語です。相手に対して使うのであれば「おっしゃいました」などが適切です",
        },
        {
          checkExpression: "ご覧になられ",
          className: "goranninarare",
          fixMessage: "「ご覧になる」「ご覧になった」が適切です",
        },
        {
          checkExpression: "教授",
          className: "kyoju",
          fixMessage:
            "「ご教授ください」は学問や技芸を教え授ける意味で使われる言葉です。「ご教示ください」が適切ではないでしょうか？",
        },
        {
          checkExpression: "拝見され",
          className: "haikensare",
          fixMessage:
            "「拝見する」は謙譲語ですので主語が自分のときに使います。主語が相手であれば「ご覧になる」が適切です",
        },
        {
          checkExpression: "御社",
          className: "onnsya",
          fixMessage: "「御社」は口語であるため「貴社」が適切です",
        },
        {
          checkExpression: "大丈夫",
          className: "daijoubu",
          fixMessage:
            "「問題ございません」「結構です」「差し支えありません」などの表現がより適切ではないでしょうか？",
        },
        {
          checkExpression: "お伺",
          className: "oukagai",
          fixMessage: "「伺う」はすでに敬語であるため「お」はつけません",
        },
        {
          checkExpression: "致しま",
          className: "itasu",
          fixMessage: "謙譲語の「〇〇致します」は「〇〇いたします」が適切です",
        },
        {
          checkExpression: "しばらくぶりです",
          className: "shibarakuburidesu",
          fixMessage: "「ご無沙汰しております」などがより適切です",
        },
        {
          checkExpression: "体をご自愛",
          className: "gojiai",
          fixMessage: "「ご自愛ください」自体に、「体を大切にしてください」という意味が含まれています",
        },
        {
          checkExpression: "なるほど",
          className: "naruhodo",
          fixMessage: "「承知しました」「おっしゃる通りです」などが適切です",
        },
        {
          checkExpression: "おっしゃられ",
          className: "ossyarare",
          fixMessage: "「言う」の尊敬語の「おっしゃる」と、尊敬の表現である「お～られる」が重複した尊敬表現です。「おっしゃる」「おっしゃった」などが適切です",
        },
        {
          checkExpression: "拝見いたし",
          className: "haikenitashi",
          fixMessage: "「見る」の謙譲語の「拝見する」に「する」の謙譲語の「致す」をつけた過剰な謙譲表現です。「拝見しました」が適切です",
        },
      ],
    };
  },
  computed: {
    sanitizedUserInputText() {
      let tmp = sanitizeHtml(this.userInputText, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: "escape",
      });

      // 改行も変える
      return tmp.replaceAll("\n", "<br/>");
    },
  },
  methods: {
    // 校正をする
    proofread() {
      // 状態を初期化
      this.fixes = [];

      // 校正
      this.fixTemplate.forEach((fixItem) => {
        this.check(
          this.sanitizedUserInputText,
          fixItem.checkExpression,
          fixItem.className,
          fixItem.fixMessage
        );
      });

      // 校正を入れたHTMLを作る
      this.proofreadText = this.makeProofreadText(
        this.sanitizedUserInputText,
        this.fixes
      );
    },

    // 単語を受け取って、それが文章内にあるかをチェックするだけの簡単な校正メソッド
    check(beingProofread, checkExpression, toolTipClassName, fixMessage) {
      let index = 0;
      while (beingProofread.indexOf(checkExpression, index) > -1) {
        index = beingProofread.indexOf(checkExpression, index);
        this.fixes.push({
          start: index,
          end: index + checkExpression.length,
          toolTipClassName: toolTipClassName,
          fixMessage: fixMessage,
        });
        index =
          beingProofread.indexOf(checkExpression, index) +
          checkExpression.length;
      }
    },

    // 校正を入れたHTMLを作って返す
    makeProofreadText(userInputText, fixes) {
      // 後ろから作ることでfixesのインデックスがそのまま使えるため、一度fixesをstartの降順で並び替える。
      fixes.sort((fixA, fixB) => fixB.start - fixA.start);
      fixes.forEach((fix) => {
        // 閉じタグ部分
        userInputText =
          userInputText.slice(0, fix.end) +
          "</span>" +
          userInputText.slice(fix.end);
        // 開始タブ部分
        userInputText =
          userInputText.slice(0, fix.start) +
          '<span style="color: red" class="' +
          fix.toolTipClassName +
          '">' +
          userInputText.slice(fix.start);
      });

      return userInputText;
    },
  },
  watch: {
    proofreadText() {
      // 0.5秒待つ
      const halfSecond = 500;
      setTimeout(() => {
        // ツールチップをつけるクラス名と文言をfixesの中から探してdistinctする
        let tooltipClassNameAndMessageArray = [];
        this.fixes.forEach((elem) => {
          if (
            !tooltipClassNameAndMessageArray
              .map((elem) => elem.toolTipClassName)
              .includes(elem.toolTipClassName)
          ) {
            tooltipClassNameAndMessageArray.push({
              toolTipClassName: elem.toolTipClassName,
              fixMessage: elem.fixMessage,
            });
          }

          // ツールチップをつける
          tooltipClassNameAndMessageArray.forEach((elem) => {
            tippy("." + elem.toolTipClassName, {
              content: elem.fixMessage,
              placement: "bottom",
            });
          });
        }, halfSecond);
      });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

.el-row {
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
}
.el-col {
  border-radius: 4px;
}
.bg-purple-dark {
  background: #99a9bf;
}
.bg-purple {
  background: #d3dce6;
}
.bg-purple-light {
  background: #e5e9f2;
}
.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
.row-bg {
  padding: 10px 0;
  background-color: #f9fafc;
}
</style>
