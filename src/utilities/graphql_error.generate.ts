import { GraphQLError } from 'graphql';
import i18n from 'i18n';

interface IGraphqlErrorGenerate {
  message?: string;
  code: string;
  i18n?: {
    phrase?: string;
    locale?: string;
    replacements?: i18n.Replacements;
  };
}

export const generateGraphqlError = ({
  message,
  i18n: i18nConfig,
  code,
}: IGraphqlErrorGenerate): GraphQLError => {
  let formattedMsg: string = message || '';

  if (i18nConfig) {
    const {
      phrase = 'application.error.something_went_wrong',
      locale = 'en',
      replacements = {},
    } = i18nConfig;
    formattedMsg = i18n.__(
      {
        phrase: phrase || '',
        locale,
      },
      replacements
    );
  }

  return new GraphQLError(formattedMsg, { extensions: { code } });
};
